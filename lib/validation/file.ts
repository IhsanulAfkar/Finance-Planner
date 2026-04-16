type ValidateImageOptions = {
  maxSizeMB?: number
  allowedTypes?: string[]
  required?: boolean
}

export function validateImage(
  file: File | null,
  options?: ValidateImageOptions
) {
  const {
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    required = false,
  } = options || {}

  if (!file) {
    if (required) return "Image is required"
    return null
  }

  if (!(file instanceof File)) {
    return "Invalid file"
  }

  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
  }

  const maxSize = maxSizeMB * 1024 * 1024

  if (file.size > maxSize) {
    return `File too large. Max ${maxSizeMB}MB allowed`
  }

  return null
}