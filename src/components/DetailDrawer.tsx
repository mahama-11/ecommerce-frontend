import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Z_INDEX } from '@/styles/zIndex'
import { Button } from '@/components/ui/Button'

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
      const scrollY = window.scrollY
      const previousOverflow = document.body.style.overflow
      const previousPosition = document.body.style.position
      const previousTop = document.body.style.top
      const previousWidth = document.body.style.width
      setMounted(true)
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      const frame = window.requestAnimationFrame(() => setVisible(true))
      return () => {
        window.cancelAnimationFrame(frame)
        document.body.style.overflow = previousOverflow
        document.body.style.position = previousPosition
        document.body.style.top = previousTop
        document.body.style.width = previousWidth
        window.scrollTo({ top: scrollY, behavior: 'auto' })
      }
    }
    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), 220)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 ${Z_INDEX.drawer} flex justify-end bg-black/50 backdrop-blur-sm transition-colors duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="button"
      tabIndex={-1}
      aria-label="关闭详情抽屉"
      onClick={onClose}
      onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') onClose() }}
    >
      <div
        className={`flex h-full w-full max-w-md flex-col overflow-hidden border-l border-white/[0.08] bg-[var(--ecom-popover-bg)] p-5 shadow-2xl transition-transform duration-220 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-6'
        }`}
        role="presentation"
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            {subtitle ? <div className="text-xs text-white/35">{subtitle}</div> : null}
            <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          </div>
          <Button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] p-2 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="scrollbar-subtle min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  )
}
