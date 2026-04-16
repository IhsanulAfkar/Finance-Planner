import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/apiAuth"
import { createCategorySchema } from "@/lib/validation/savings"

export const GET = withAuth(async (req, auth) => {
  const data = await prisma.savingsCategory.findMany({
    where: { user_id: auth.user.id },
    orderBy: { created_at: "desc" },
  })

  return NextResponse.json({ data })
})

export const POST = withAuth(async (req, auth) => {
  const body = await req.json()
  const { error } = createCategorySchema.validate(body)

  if (error) {
    return NextResponse.json(
      {
        message: "Validation error",
        errors: error.details.map((e) => e.message),
      },
      { status: 400 }
    )
  }
  const existing = await prisma.savingsCategory.findFirst({
    where: {
      name: body.name, user_id: auth.user.id
    }
  })
  if (existing) return NextResponse.json({ message: "Duplicate Savings Category" }, { status: 409 })
  const category = await prisma.savingsCategory.create({
    data: {
      name: body.name,
      user_id: auth.user.id,
    },
  })

  return NextResponse.json({ data: category })
})