import { TransactionType } from "@/generated/prisma/enums";
import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getMonthRanges } from "@/lib/utils";
import { getRedisClient, isRedisConnected } from "@/service/redis";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { ollama } from "ollama-ai-provider-v2";
import z from "zod";

export const GET = withAuth<{ month?: string }>(async (req, auth, { params }) => {
  try {
    const redis = getRedisClient()
    const connected = isRedisConnected()
    const userId = auth.user.id
    const cacheKey = `dashboard-insight:${userId}`
    if (connected) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ data: JSON.parse(cached), message: "Success get from cache" });
      }
    }
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ?? undefined;

    const { current, last } = getMonthRanges(month);

    // =========================
    // 1. Aggregate current & last
    // =========================
    const [currentAgg, lastAgg] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: { gte: current.start, lt: current.end },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: { gte: last.start, lt: last.end },
        },
        _sum: { amount: true },
      }),
    ]);

    const mapAgg = (agg: typeof currentAgg) => {
      let income = 0;
      let expense = 0;

      for (const item of agg) {
        if (item.type === TransactionType.INCOME)
          income = item._sum.amount ?? 0;
        if (item.type === TransactionType.EXPENSE)
          expense = item._sum.amount ?? 0;
      }

      return { income, expense };
    };

    const currentData = mapAgg(currentAgg);
    const lastData = mapAgg(lastAgg);

    const netCurrent = currentData.income - currentData.expense;
    const netLast = lastData.income - lastData.expense;

    const savingsRateCurrent =
      currentData.income > 0
        ? (netCurrent / currentData.income) * 100
        : 0;

    const savingsRateLast =
      lastData.income > 0 ? (netLast / lastData.income) * 100 : 0;

    // =========================
    // 2. Category breakdown (current month)
    // =========================
    const categoryAgg = await prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        type: TransactionType.EXPENSE,
        date: { gte: current.start, lt: current.end },
      },
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: "desc" },
      },
      take: 3,
    });

    const categories = await prisma.transactionCategory.findMany({
      where: {
        id: { in: categoryAgg.map((c) => c.category_id!).filter(Boolean) },
      },
    });

    const topCategories = categoryAgg.map((c) => {
      const cat = categories.find((x) => x.id === c.category_id);
      return {
        name: cat?.name ?? "Unknown",
        amount: c._sum.amount ?? 0,
      };
    });

    // =========================
    // 3. Compute signals (IMPORTANT)
    // =========================
    const expenseGrowth =
      lastData.expense > 0
        ? ((currentData.expense - lastData.expense) / lastData.expense) * 100
        : 0;

    const incomeGrowth =
      lastData.income > 0
        ? ((currentData.income - lastData.income) / lastData.income) * 100
        : 0;

    const savingsRateDiff = savingsRateCurrent - savingsRateLast;

    const insightsPayload = {
      income: {
        current: currentData.income,
        last: lastData.income,
        growth: Number(incomeGrowth.toFixed(2)),
      },
      expense: {
        current: currentData.expense,
        last: lastData.expense,
        growth: Number(expenseGrowth.toFixed(2)),
      },
      savingsRate: {
        current: Number(savingsRateCurrent.toFixed(2)),
        last: Number(savingsRateLast.toFixed(2)),
        diff: Number(savingsRateDiff.toFixed(2)),
      },
      topCategories,
    };

    // =========================
    // 4. Send to LLM (structured output)
    // =========================
    const result = await generateText({
      model: ollama(process.env.OLLAMA_MODEL!),
      output: Output.object({
        schema: z.object({
          insights: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              type: z.enum(["positive", "warning", "neutral"]),
            })
          )
        }),
      }),
      prompt: `
You are a personal finance assistant.
Generate max 5 concise insights based on the data.
Each insight MUST follow:
- title: short (2-5 words)
- description: 1 sentence, actionable
- type:
  - "positive" → good trend
  - "warning" → needs attention
  - "neutral" → informative

Rules:
- Be concise
- Use simple language
- Focus on trends (increase/decrease)
- If the data is empty or insufficient, return:
  { "insights": [] }

Data:
${JSON.stringify(insightsPayload, null, 2)}
`,
    });
    const resp = {
      data: result.output.insights,
      meta: insightsPayload,
    }
    if (connected) {
      await redis.set(cacheKey, JSON.stringify(resp), "EX", 300);
    }
    return NextResponse.json({ data: resp, message: 'Success get insights' });
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 })
  }
})