import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const DELETE = withAuth<{ id: string }>(async (req, auth, { params }) => {
  try {
    const id = Number(params?.id)

    // ✅ Check if category exists & belongs to user
    const existing = await prisma.account.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 }
      )
    }


    await prisma.account.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Account deleted successfully",
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
})