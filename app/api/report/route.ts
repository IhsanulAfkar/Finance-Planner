import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/apiAuth"
import {
  formatPeriod,
  generatePeriods,
  getReportRange,
  type ReportPeriod,
  type ReportSelection,
} from "@/lib/reportRange"

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url)
  const requestedPeriod = searchParams.get("period") as ReportPeriod | null
  const period: ReportPeriod = ["day", "week", "month", "year"].includes(
    requestedPeriod as ReportPeriod
  )
    ? (requestedPeriod as ReportPeriod)
    : "month"

  const selection: ReportSelection = {
    period,
    date: searchParams.get("date"),
    month: searchParams.get("month"),
    year: Number(searchParams.get("year")) || undefined,
  }

  const { start, end } = getReportRange(selection)

  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: auth.user.id,
      date: {
        gte: start,
        lt: end,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
      category_id: true,
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  const map = new Map<
    string,
    { income: number; expense: number }
  >()
  const categoryTotals = new Map<number | null, number>()

  for (const t of transactions) {
    const periodLabel = formatPeriod(new Date(t.date), period)

    const prev = map.get(periodLabel) || { income: 0, expense: 0 }

    if (t.type === "INCOME") {
      totalIncome += t.amount
      prev.income += t.amount
    } else {
      totalExpense += t.amount
      prev.expense += t.amount
      categoryTotals.set(
        t.category_id,
        (categoryTotals.get(t.category_id) || 0) + t.amount
      )
    }

    map.set(periodLabel, prev)
  }

  // Expense breakdown by category for the selected period
  const categoryIds = [...categoryTotals.keys()].filter(
    (id): id is number => id !== null
  )
  const categories = categoryIds.length
    ? await prisma.transactionCategory.findMany({
        where: {
          user_id: auth.user.id,
          id: { in: categoryIds },
        },
        select: { id: true, name: true, color: true },
      })
    : []
  const categoryNames = new Map(categories.map((c) => [c.id, c]))
  const categoryBreakdown = [...categoryTotals.entries()]
    .map(([id, amount]) => ({
      id: id ?? 0,
      category: id === null
        ? "Uncategorized"
        : categoryNames.get(id)?.name ?? "Uncategorized",
      color: id === null ? null : categoryNames.get(id)?.color ?? null,
      amount,
      percentage: totalExpense > 0
        ? Number(((amount / totalExpense) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // 🔥 fill missing periods
  const periods = generatePeriods(selection)
  const goals = await prisma.savingsGoal.findMany({
    where: { user_id: auth.user.id },
    select: {
      id: true,
      title: true,
      target_amount: true,
    },
  })
  const goalsMeta = goals.map((g) => ({
    id: g.id,
    key: `goal-${g.id}`,
    title: g.title,
    target: g.target_amount, // optional bonus
  }))
  const contributions = await prisma.savingsContribution.findMany({
    where: {
      goal: {
        user_id: auth.user.id,
      },
      date: {
        gte: start,
        lt: end,
      },
    },
    select: {
      goal_id: true,
      amount: true,
      date: true,
    },
  })
  const goalPeriodMap = new Map<
    number,
    Map<string, number>
  >()

  for (const g of goals) {
    goalPeriodMap.set(g.id, new Map())
  }

  for (const c of contributions) {
    const periodLabel = formatPeriod(new Date(c.date), period)

    const map = goalPeriodMap.get(c.goal_id)!
    map.set(periodLabel, (map.get(periodLabel) || 0) + c.amount)
  }
  const goalMap = new Map<number, number>()

  for (const c of contributions) {
    const prev = goalMap.get(c.goal_id) || 0
    goalMap.set(c.goal_id, prev + c.amount)
  }

  // initialize cumulative tracker per goal

  const cumulativeMap = new Map<number, number>()
  for (const g of goals) {
    cumulativeMap.set(g.id, 0)
  }

  const graph = periods.map((period) => {
    const row: any = { period }

    for (const g of goals) {
      const periodMap = goalPeriodMap.get(g.id)!
      const current = periodMap.get(period) || 0

      const prev = cumulativeMap.get(g.id) || 0
      const cumulative = prev + current

      cumulativeMap.set(g.id, cumulative)

      const key = `goal-${g.id}`
      row[key] = cumulative
    }
    const data = map.get(period) || { income: 0, expense: 0 }

    const savings = data.income - data.expense

    const savingsRate =
      data.income > 0 ? savings / data.income : 0


    return {
      ...row,
      income: data.income,
      expense: data.expense,
      savings,
      savingsRate,
    }
  })
  let trend = {
    direction: "stable" as "up" | "down" | "stable",
    rateDiff: 0,
    amountDiff: 0,
  }

  if (graph.length >= 2) {
    const last = graph[graph.length - 1]
    const prev = graph[graph.length - 2]

    const rateDiff = last.savingsRate - prev.savingsRate
    const amountDiff = last.savings - prev.savings

    trend = {
      direction:
        rateDiff > 0
          ? "up"
          : rateDiff < 0
            ? "down"
            : "stable",
      rateDiff,
      amountDiff,
    }
  }
  const totalSavings = totalIncome - totalExpense

  const overallSavingsRate =
    totalIncome > 0 ? totalSavings / totalIncome : 0
  return NextResponse.json({
    data: {
      totalIncome,
      totalExpense,
      totalSavings,
      overallSavingsRate,
      trend,
      graph,
      graphMeta: {
        goal: goalsMeta
      },
      categories: categoryBreakdown,
    }
  })
})