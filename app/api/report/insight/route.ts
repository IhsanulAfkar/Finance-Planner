import { TransactionType } from "@/generated/prisma/enums";
import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  getPreviousReportRange,
  getReportRange,
  type ReportPeriod,
  type ReportSelection,
} from "@/lib/reportRange";
import { getRedisClient, isRedisConnected } from "@/service/redis";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { ollama } from "ollama-ai-provider-v2";
import z from "zod";

export const GET = withAuth<{ period?: string }>(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPeriod = searchParams.get("period") as ReportPeriod | null;
    const period: ReportPeriod = ["day", "week", "month", "year"].includes(
      requestedPeriod as ReportPeriod,
    )
      ? (requestedPeriod as ReportPeriod)
      : "month";

    const selection: ReportSelection = {
      period,
      date: searchParams.get("date"),
      month: searchParams.get("month"),
      year: Number(searchParams.get("year")) || undefined,
    };

    const userId = auth.user.id;
    const redis = getRedisClient();
    const connected = isRedisConnected();
    const selectionKey = `${period}:${selection.date ?? ""}:${selection.month ?? ""}:${selection.year ?? ""}`;
    const cacheKey = `report-insight:${userId}:${selectionKey}`;

    if (connected) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          data: JSON.parse(cached),
          message: "Success get report insight from cache",
        });
      }
    }

    const current = getReportRange(selection);
    const last = getPreviousReportRange(selection);

    // 1. Totals for the current and previous comparable window
    const [currentAgg, lastAgg] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: { gte: current.start, lt: current.end },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: { gte: last.start, lt: last.end },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const mapAgg = (agg: typeof currentAgg) => {
      let income = 0;
      let expense = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      for (const item of agg) {
        if (item.type === TransactionType.INCOME) {
          income = item._sum.amount ?? 0;
          incomeCount = item._count._all;
        }
        if (item.type === TransactionType.EXPENSE) {
          expense = item._sum.amount ?? 0;
          expenseCount = item._count._all;
        }
      }

      const net = income - expense;
      return {
        income,
        expense,
        net,
        incomeCount,
        expenseCount,
        savingsRate: income > 0 ? (net / income) * 100 : 0,
        averageExpense: expenseCount > 0 ? expense / expenseCount : 0,
      };
    };

    const currentData = mapAgg(currentAgg);
    const lastData = mapAgg(lastAgg);

    const growth = (value: number, previous: number) => {
      if (previous > 0) return ((value - previous) / previous) * 100;
      return value > 0 ? 100 : 0;
    };

    // 2. Top spending categories for the selected period
    const categoryAgg = await prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        type: TransactionType.EXPENSE,
        date: { gte: current.start, lt: current.end },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    const categories = await prisma.transactionCategory.findMany({
      where: {
        id: { in: categoryAgg.map((c) => c.category_id!).filter(Boolean) },
      },
      select: { id: true, name: true },
    });

    const topCategories = categoryAgg.map((c) => {
      const category = categories.find((x) => x.id === c.category_id);
      const amount = c._sum.amount ?? 0;
      return {
        name: category?.name ?? "Uncategorized",
        amount,
        percentage:
          currentData.expense > 0
            ? Number(((amount / currentData.expense) * 100).toFixed(2))
            : 0,
      };
    });

    // 3. Recent trend inside the current window (first half vs second half)
    const midpoint = new Date(
      (current.start.getTime() + current.end.getTime()) / 2,
    );
    const [firstHalf, secondHalf] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          user_id: userId,
          type: TransactionType.EXPENSE,
          date: { gte: current.start, lt: midpoint },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          user_id: userId,
          type: TransactionType.EXPENSE,
          date: { gte: midpoint, lt: current.end },
        },
      }),
    ]);
    const firstHalfExpense = firstHalf._sum.amount ?? 0;
    const secondHalfExpense = secondHalf._sum.amount ?? 0;

    const insightsPayload = {
      period,
      selection: {
        date: selection.date ?? null,
        month: selection.month ?? null,
        year: selection.year ?? null,
      },
      currentRange: {
        start: current.start.toISOString(),
        end: current.end.toISOString(),
      },
      previousRange: {
        start: last.start.toISOString(),
        end: last.end.toISOString(),
      },
      income: {
        current: currentData.income,
        last: lastData.income,
        growth: Number(growth(currentData.income, lastData.income).toFixed(2)),
      },
      expense: {
        current: currentData.expense,
        last: lastData.expense,
        growth: Number(growth(currentData.expense, lastData.expense).toFixed(2)),
      },
      netCashflow: {
        current: currentData.net,
        last: lastData.net,
      },
      savingsRate: {
        current: Number(currentData.savingsRate.toFixed(2)),
        last: Number(lastData.savingsRate.toFixed(2)),
        diff: Number((currentData.savingsRate - lastData.savingsRate).toFixed(2)),
      },
      expenseFrequency: {
        current: {
          count: currentData.expenseCount,
          average: Number(currentData.averageExpense.toFixed(2)),
        },
        last: {
          count: lastData.expenseCount,
          average: Number(lastData.averageExpense.toFixed(2)),
        },
      },
      recentExpenseTrend: {
        firstHalf: firstHalfExpense,
        secondHalf: secondHalfExpense,
        change: Number(growth(secondHalfExpense, firstHalfExpense).toFixed(2)),
      },
      topCategories,
    };

    const hasData =
      currentData.income + currentData.expense + lastData.income + lastData.expense >
      0;

    let insights: {
      title: string;
      description: string;
      type: "positive" | "warning" | "neutral";
    }[] = [];

    if (hasData) {
      const result = await generateText({
        model: ollama(process.env.OLLAMA_MODEL!),
        output: Output.object({
          schema: z.object({
            insights: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                type: z.enum(["positive", "warning", "neutral"]),
              }),
            ),
          }),
        }),
        prompt: `
You are a personal finance assistant writing insights for a financial report.
The report period is "${period}" (compared with the previous comparable ${period}).
Generate max 5 concise insights based on the data.
Each insight MUST follow:
- title: short (2-5 words)
- description: 1 sentence, actionable
- type:
  - "positive" → good trend
  - "warning" → needs attention
  - "neutral" → informative

Rules:
- Be concise and use simple language
- Focus on trends (increase/decrease) versus the previous ${period}
- Reference the top spending categories when relevant
- Use the numbers provided; never invent data
- If the data is empty or insufficient, return: { "insights": [] }

Data:
${JSON.stringify(insightsPayload, null, 2)}
`,
      });
      insights = result.output.insights;
    }

    const resp = {
      data: insights,
      meta: insightsPayload,
    };

    if (connected) {
      await redis.set(cacheKey, JSON.stringify(resp), "EX", 300);
    }

    return NextResponse.json({
      data: resp,
      message: "Success get report insights",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || "Server Error" },
      { status: 500 },
    );
  }
});
