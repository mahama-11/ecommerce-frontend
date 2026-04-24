import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DetailDrawerProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

export default function DetailDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: DetailDrawerProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), 220)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm transition-all duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`h-full w-full max-w-md border-l border-white/[0.08] bg-[#0d1018]/95 p-5 shadow-2xl transition-transform duration-220 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-6'
        }`}
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            {subtitle ? <div className="text-xs text-white/35">{subtitle}</div> : null}
            <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] p-2 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}
