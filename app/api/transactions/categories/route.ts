import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/apiAuth"
import { createCategorySchema } from "@/lib/validation/transaction"

export const GET = withAuth(async (req, auth) => {
  const categories = await prisma.transactionCategory.findMany({
    where: {
      user_id: auth.user.id,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return NextResponse.json({ data: categories })
})

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json()

    const { error, value } = createCategorySchema.validate(body, {
      abortEarly: false,
    })

    if (error) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: error.details.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    // ✅ prevent duplicate
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        user_id: auth.user.id,
        name: value.name,
        type: value.type,
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: "Category already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.transactionCategory.create({
      data: {
        ...value,
        user_id: auth.user.id,
      },
    })

    return NextResponse.json({ data: category })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
})
