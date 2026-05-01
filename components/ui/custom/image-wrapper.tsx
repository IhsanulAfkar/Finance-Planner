'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = Omit<ImageProps, 'src'> & {
  src?: string | null
  fallbackSrc?: string
  className?: string
}

const DEFAULT_FALLBACK = '/assets/images/default-image.png' // adjust to your asset
export default function ImageWrapper({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  className,
}: Props) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

  const handleError = () => {
    if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc)
  }

  const handleClick = () => {
    if (imgSrc) window.open(imgSrc, '_blank', 'noopener,noreferrer')
  }

  return (<img
    className={cn('relative cursor-pointer overflow-hidden', className)}
    onClick={handleClick}
    src={imgSrc}
    alt={alt || 'image'}
    onError={handleError}
    style={{
      objectFit: 'contain',
    }}
  />
  )
}