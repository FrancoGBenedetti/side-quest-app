import { useState, useCallback } from 'react'
import { cn } from '../../utils/cn'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastData {
  id: string
  message: string
  variant: ToastVariant
}

let toastCallback: ((message: string, variant: ToastVariant) => void) | null = null

export function toast(message: string, variant: ToastVariant = 'info') {
  toastCallback?.(message, variant)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  toastCallback = addToast

  const variants = {
    success: 'bg-green-900 border-green-700 text-green-100',
    error: 'bg-red-900 border-red-700 text-red-100',
    info: 'bg-gray-800 border-gray-700 text-gray-100',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg max-w-sm',
            variants[t.variant]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
