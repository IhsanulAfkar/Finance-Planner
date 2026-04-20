import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json()

    const initialBalance = Number(body.balance) || 0

    // ✅ Check duplicate type
    const existing = await prisma.account.findFirst({
      where: {
        user_id: auth.user.id,
        type: body.type,
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: `Account for type ${body.type} already exists` },
        { status: 400 }
      )
    }

    // 🔥 Use transaction (VERY IMPORTANT)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create account (start with 0)
      const account = await tx.account.create({
        data: {
          user_id: auth.user.id,
          description: body.description,
          type: body.type,
          balance: 0,
        },
      })

      // 2. If initial balance exists → create transaction
      if (initialBalance !== 0) {
        await tx.transaction.create({
          data: {
            user_id: auth.user.id,
            account_id: account.id,
            amount: Math.abs(initialBalance),
            type: initialBalance > 0 ? "INCOME" : "EXPENSE",
            description: "Initial cash",
            source: "Initial Cash",
            date: new Date(),
          },
        })

        // 3. Update account balance
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: initialBalance,
          },
        })
      }

      return account
    })

    return NextResponse.json({ data: result })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { message: "Account type already exists" },
        { status: 400 }
      )
    }

    console.error(err)

    return NextResponse.json(
      { message: "Failed to create account" },
      { status: 500 }
    )
  }
})
export const GET = withAuth(async (req, auth) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        user_id: auth.user.id
      }
    })

    return NextResponse.json({ data: accounts })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    )
  }
})