import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);

    // 1️⃣ Parse query params
    const startParam = searchParams.get("start_date");
    const endParam = searchParams.get("end_date");

    const today = new Date();

    const defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 10);

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : today;

    // normalize time
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 2️⃣ Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: auth.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    // 3️⃣ Initialize all months in range
    const resultMap = new Map<
      string,
      {
        year: number;
        monthIndex: number;
        month: string;
        income: number;
        expense: number;
      }
    >();

    const cursor = new Date(startDate);
    cursor.setDate(1); // 🔥 prevent month skipping bug

    while (cursor <= endDate) {
      const year = cursor.getFullYear();
      const monthIndex = cursor.getMonth();

      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
      }).format(cursor);

      const key = `${year}-${monthIndex}`;

      resultMap.set(key, {
        year,
        monthIndex,
        month: monthName,
        income: 0,
        expense: 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    // 4️⃣ Fill with transaction data
    for (const trx of transactions) {
      const d = new Date(trx.date);

      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const key = `${year}-${monthIndex}`;

      const item = resultMap.get(key);
      if (!item) continue;

      if (trx.type === "INCOME") {
        item.income += trx.amount;
      } else {
        item.expense += trx.amount;
      }
    }

    // 5️⃣ Sort result
    const result = Array.from(resultMap.values())
      .sort((a, b) =>
        a.year !== b.year
          ? a.year - b.year
          : a.monthIndex - b.monthIndex
      )
      .map(({ year, month, income, expense }) => ({
        year: year.toString(),
        month,
        income,
        expense,
      }));

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error("GET monthly stats error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});