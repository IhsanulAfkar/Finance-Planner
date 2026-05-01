import { TransactionType } from "@/generated/prisma/enums";
import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getMonthRanges } from "@/lib/utils";
import { NextResponse } from "next/server";

export const GET = withAuth<{
  month?: string
}>(async (req, auth, { params }) => {
  try {
    const userId = auth.user.id;
    const { current, last } = getMonthRanges(params?.month as string);

    const data = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        user_id: userId,
        date: {
          gte: last.start, // cover BOTH months
          lt: current.end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });



    const [currentAgg, lastAgg] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: {
            gte: current.start,
            lt: current.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          user_id: userId,
          date: {
            gte: last.start,
            lt: last.end,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const mapAgg = (agg: typeof currentAgg) => {
      let income = 0;
      let expense = 0;

      for (const item of agg) {
        if (item.type === TransactionType.INCOME) {
          income = item._sum.amount ?? 0;
        }
        if (item.type === TransactionType.EXPENSE) {
          expense = item._sum.amount ?? 0;
        }
      }

      const net = income - expense;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;

      return {
        income,
        expense,
        net,
        savingsRate,
      };
    };

    const currentData = mapAgg(currentAgg);
    const lastData = mapAgg(lastAgg);

    return NextResponse.json({
      data: {
        data: {
          totalIncome: {
            current: currentData.income,
            last: lastData.income,
          },
          totalExpense: {
            current: currentData.expense,
            last: lastData.expense,
          },
          netCashflow: {
            current: currentData.net,
            last: lastData.net,
          },
          savingsRate: {
            current: Number(currentData.savingsRate.toFixed(2)),
            last: Number(lastData.savingsRate.toFixed(2)),
          },
        }
      },
    });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
})