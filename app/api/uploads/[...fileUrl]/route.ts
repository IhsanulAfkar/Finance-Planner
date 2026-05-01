import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withAuth } from '@/lib/apiAuth'


export const GET = withAuth<{ fileUrl: string[] }>(async (req, auth, { params }) => {
  try {
    const userId = auth.user.id

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const fileUrlParts = params?.fileUrl || []

    // Expect: /uploads/users/:userId/...
    if (fileUrlParts.length < 3) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 })
    }

    const [folder, usersKeyword, fileUserId, ...restPath] = fileUrlParts

    if (folder !== 'users' || usersKeyword !== String(userId)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Build absolute path safely
    const baseDir = path.join(process.cwd(), 'uploads')
    const requestedPath = path.join(baseDir, ...fileUrlParts)

    // 🔒 جلوگیری path traversal
    if (!requestedPath.startsWith(baseDir)) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 })
    }

    if (!fs.existsSync(requestedPath)) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(requestedPath)

    const ext = path.extname(requestedPath).toLowerCase()

    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    }

    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
})