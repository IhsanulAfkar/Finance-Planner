import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, auth) => {
  try {

  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
})