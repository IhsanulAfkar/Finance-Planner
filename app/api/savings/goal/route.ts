import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { createGoalSchema } from "@/lib/validation/savings"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, auth) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { user_id: auth.user.id },
    include: {
      category: true,
      contributions: {
        select: {
          amount: true,
          date: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  })

  const data = goals.map((goal) => {
    const map = new Map<string, number>()

    for (const c of goal.contributions) {
      const date = new Date(c.date)

      const year = date.getFullYear().toString()
      const month = date.toLocaleString('en-US', { month: 'long' })

      const key = `${year}-${month}`

      const prev = map.get(key) || 0
      map.set(key, prev + c.amount)
    }

    const graph = Array.from(map.entries()).map(([key, amount]) => {
      const [year, month] = key.split('-')
      return { year, month, amount }
    })

    // optional: sort by date
    graph.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`)
      const dateB = new Date(`${b.month} 1, ${b.year}`)
      return dateA.getTime() - dateB.getTime()
    })

    return {
      ...goal,
      graph,
    }
  })

  return NextResponse.json({ data })
})
export const POST = withAuth(async (req, auth) => {
  try {

    const body = await req.json()
    const validation = createGoalSchema.validate(body)
    if (validation.error) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: validation.error.details.map((e) => e.message),
        },
        { status: 400 }
      )
    }
    const goal = await prisma.savingsGoal.create({
      data: {
        user_id: auth.user.id,
        title: body.title,
        category_id: body.category_id,
        target_amount: Number(body.target_amount),
        monthly_target: body.monthly_target
          ? Number(body.monthly_target)
          : null,
        target_date: body.date
          ? new Date(body.date)
          : null,
      },
    })

    return NextResponse.json({ data: goal })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server Error' }, { status: 500 })

  }
})