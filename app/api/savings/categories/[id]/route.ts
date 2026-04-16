import { withAuth } from "@/lib/apiAuth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const PATCH = withAuth<{ id: string }>(async (req, auth, { params }) => {
  const id = Number(params.id)
  const body = await req.json()

  const category = await prisma.savingsCategory.updateMany({
    where: {
      id: Number(id),
      user_id: auth.user.id,
    },
    data: {
      name: body.name,
    },
  })

  return NextResponse.json({ data: category })
})

export const DELETE = withAuth<{ id: string }>(async (req, auth, { params }) => {
  const id = Number(params.id)

  await prisma.savingsCategory.deleteMany({
    where: {
      id: Number(id),
      user_id: auth.user.id,
    },
  })

  return NextResponse.json({ message: "Deleted" })
})