import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/apiAuth"

function getDateRange(range: string) {
  const now = new Date()
  const start = new Date()

  switch (range) {
    case "day":
      start.setHours(0, 0, 0, 0)
      break
    case "week": {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      break
    }
    case "month":
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case "year":
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      throw new Error("Invalid range")
  }

  return { start, end: now }
}

function formatPeriod(date: Date, range: string) {
  switch (range) {
    case "day":
      return date.getHours().toString().padStart(2, "0")

    case "week": {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
      const dayNumber = date.getDate()
      return `${dayNumber}-${dayName}` // 15-Monday
    }

    case "month":
      return date.getDate().toString() // unchanged (1–31)

    case "year": {
      const monthName = date.toLocaleDateString("en-US", { month: "long" })
      const year = date.getFullYear()
      return `${year}-${monthName}` // 2025-December
    }

    default:
      return ""
  }
}

function generatePeriods(range: string) {
  const now = new Date()

  switch (range) {
    case "day":
      return Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      )

    case "week": {
      const start = new Date(now)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)

      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)

        const dayName = d.toLocaleDateString("en-US", { weekday: "long" })
        const dayNumber = d.getDate()

        return `${dayNumber}-${dayName}`
      })
    }

    case "month": {
      const year = now.getFullYear()
      const month = now.getMonth()
      const days = new Date(year, month + 1, 0).getDate()

      return Array.from({ length: days }, (_, i) =>
        (i + 1).toString()
      )
    }

    case "year": {
      const year = now.getFullYear()

      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(year, i, 1)
        const monthName = d.toLocaleDateString("en-US", { month: "long" })
        return `${year}-${monthName}`
      })
    }

    default:
      return []
  }
}

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url)
  const range = searchParams.get("period") || "month"

  const { start, end } = getDateRange(range)

  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: auth.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  const map = new Map<
    string,
    { income: number; expense: number }
  >()

  for (const t of transactions) {
    const period = formatPeriod(new Date(t.date), range)

    const prev = map.get(period) || { income: 0, expense: 0 }

    if (t.type === "INCOME") {
      totalIncome += t.amount
      prev.income += t.amount
    } else {
      totalExpense += t.amount
      prev.expense += t.amount
    }

    map.set(period, prev)
  }

  // 🔥 fill missing periods
  const periods = generatePeriods(range)
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
        lte: end,
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
    const period = formatPeriod(new Date(c.date), range)

    const map = goalPeriodMap.get(c.goal_id)!
    map.set(period, (map.get(period) || 0) + c.amount)
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
      }
    }
  })
})