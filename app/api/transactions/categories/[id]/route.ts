import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { createCategorySchema } from "@/lib/validation/transaction"
import { NextResponse } from "next/server"

export const PUT = withAuth<{ id: string }>(async (req, auth, { params }) => {
  try {
    const id = Number(params.id)
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

    // ✅ Check category exists & belongs to user
    const existingCategory = await prisma.transactionCategory.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      )
    }

    // ✅ Prevent duplicate (exclude current id)
    const duplicate = await prisma.transactionCategory.findFirst({
      where: {
        user_id: auth.user.id,
        name: value.name,
        type: value.type,
        NOT: {
          id,
        },
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { message: "Category already exists" },
        { status: 400 }
      )
    }

    const updated = await prisma.transactionCategory.update({
      where: { id },
      data: {
        name: value.name,
        icon: value.icon,
        color: value.color,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
})
export const DELETE = withAuth<{ id: string }>(async (req, auth, { params }) => {
  try {
    const id = Number(params.id)

    // ✅ Check if category exists & belongs to user
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      )
    }


    await prisma.transactionCategory.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Category deleted successfully",
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
})