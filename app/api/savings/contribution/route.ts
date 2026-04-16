import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json()

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction (expense)
      const transaction = await tx.transaction.create({
        data: {
          user_id: auth.user.id,
          account_id: body.account_id,
          amount: Number(body.amount),
          type: "EXPENSE",
          description: `Savings contribution`,
          date: new Date(),
        },
      })

      // 2. Create contribution
      const contribution = await tx.savingsContribution.create({
        data: {
          goal_id: body.goal_id,
          transaction_id: transaction.id,
          amount: Number(body.amount),
          date: new Date(),
        },
      })

      // 3. Reduce account balance
      await tx.account.update({
        where: { id: body.account_id },
        data: {
          balance: {
            decrement: Number(body.amount),
          },
        },
      })

      return contribution
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { message: "Failed to create contribution" },
      { status: 500 }
    )
  }
})