import fs from "fs"
import path from "path"


export async function saveImage(
  file: File,
  userId: number,
  collection?: string
): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `${Date.now()}-${file.name}`

  const baseDir = path.join(
    process.cwd(),
    "uploads",
    "users",
    String(userId)
  )

  const uploadDir = collection
    ? path.join(baseDir, collection)
    : baseDir

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, filename)

  fs.writeFileSync(filePath, buffer)

  const publicPath = collection
    ? `/uploads/users/${userId}/${collection}/${filename}`
    : `/uploads/users/${userId}/${filename}`

  return publicPath
}