import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const PATCH = withAuth<{ id: string }>(async (req, auth, { params }) => {
  const id = Number(params.id)
  const body = await req.json()

  const goal = await prisma.savingsGoal.updateMany({
    where: {
      id: Number(id),
      user_id: auth.user.id,
    },
    data: {
      title: body.title,
      target_amount: Number(body.target_amount),
      monthly_target: body.monthly_target
        ? Number(body.monthly_target)
        : null,
      target_date: body.target_date
        ? new Date(body.target_date)
        : null,
    },
  })

  return NextResponse.json({ data: goal })
})

export const DELETE = withAuth<{ id: string }>(async (req, auth, { params }) => {
  const goalId = Number(params.id)
  await prisma.$transaction(async (tx) => {
    // 0. Get goal info first
    const goal = await tx.savingsGoal.findFirst({
      where: {
        id: goalId,
        user_id: auth.user.id,
      },
      select: {
        title: true,
      },
    })

    if (!goal) {
      throw new Error('Savings goal not found')
    }

    // 1. Get contributions
    const contributions = await tx.savingsContribution.findMany({
      where: { goal_id: goalId },
      include: {
        transaction: true,
      },
    })

    const refundMap = new Map<number, number>()

    for (const c of contributions) {
      const accountId = c.transaction.account_id
      const prev = refundMap.get(accountId) || 0
      refundMap.set(accountId, prev + c.amount)
    }

    // 2. Create refund transactions with goal name
    for (const [accountId, amount] of refundMap.entries()) {
      await tx.transaction.create({
        data: {
          user_id: auth.user.id,
          account_id: accountId,
          amount,
          type: 'INCOME',
          description: `Refund from deleted goal: ${goal.title}`,
          date: new Date(),
          source: `Refund From Goals ${goal.title}`,
        },
      })
    }

    // 3. Delete goal (cascade)
    await tx.savingsGoal.delete({
      where: { id: goalId },
    })
  })

  return NextResponse.json({ message: "Deleted and refunded" })
})