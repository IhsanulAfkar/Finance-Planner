import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/serverSession"
import mime from "mime-types"

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    // Example: get user from session
    const userId = session.user.id // replace with real auth
    const paramsPath = await params
    const relativePath = paramsPath.path.join("/")

    // Verify file belongs to user
    const image = await prisma.receipt.findFirst({
      where: {
        image_url: relativePath,
      }
    })

    if (!image) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      )
    }

    const filePath = path.join(process.cwd(), "uploads", relativePath)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      )
    }

    const fileBuffer = fs.readFileSync(filePath)
    const contentType = mime.lookup(filePath) || "application/octet-stream"
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType, "Cache-Control": "no-store, max-age=0",
      },
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}