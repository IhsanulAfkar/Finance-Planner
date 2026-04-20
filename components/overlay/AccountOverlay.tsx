'use client'
import useAccount from '@/hooks/datasource/useAccount'
import { useRouter } from '@bprogress/next/app'
import { NextPage } from 'next'
import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'


interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const AccountOverlay: NextPage = () => {
  const { data: accounts, isLoading } = useAccount()
  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const shouldShowOverlay = !isLoading && (!accounts || accounts.length === 0)

  useEffect(() => {
    setMounted(true)

    const updateRect = () => {
      const el = document.getElementById('main-container')
      if (!el) return

      const r = el.getBoundingClientRect()
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      })
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [])

  return (
    <>

      {mounted && shouldShowOverlay && rect &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              zIndex: 9999,
            }}
            className="flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
              <h2 className="text-xl font-semibold mb-2">
                No Account Found
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                You need to create an account before using the dashboard.
              </p>

              <button
                onClick={() => {
                  router.push('/dashboard/setting')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Account
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default AccountOverlay