import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { label: '商品队列', to: '/products', match: (pathname: string) => pathname === '/products' || /^\/products\/[^/]+$/.test(pathname) },
  { label: '批量 Listing', to: '/products/workbench/batch-listing', match: (pathname: string) => pathname.startsWith('/products/workbench/batch-listing') },
  { label: '视觉工作区', to: '/products/workbench/visual-tools', match: (pathname: string) => pathname.startsWith('/products/workbench/visual-tools') || /\/products\/[^/]+\/ai\/[^/]+$/.test(pathname) },
  { label: '交付中心', to: '/products/workbench/downloads', match: (pathname: string) => pathname.startsWith('/products/workbench/downloads') },
]

const commands = [
  { label: '打开商品队列', hint: 'Queue / SKU board', to: '/products' },
  { label: '进入批量 Listing', hint: 'Template → validate → adopt', to: '/products/workbench/batch-listing' },
  { label: '进入视觉工作区', hint: 'Bind SKU → generate → attach', to: '/products/workbench/visual-tools' },
  { label: '打开交付中心', hint: 'Export tasks / downloads', to: '/products/workbench/downloads' },
]

export default function ProductWorkbenchLayout() {
  const { pathname } = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e8eaf0]">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080b11]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1400px] items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/products" className="whitespace-nowrap font-semibold tracking-tight text-white">Product Center</Link>
            <nav className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
              {navItems.map(item => {
                const active = item.match(pathname)
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-white/[0.07] text-white' : 'text-white/58 hover:bg-white/[0.04] hover:text-white'}`}
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>
          <button onClick={() => setCommandOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#080b11] px-2.5 py-1 text-xs text-white/45 transition hover:border-white/15 hover:text-white/70">
            <kbd className="rounded bg-white/[0.07] px-1">⌘</kbd><span>K</span>
          </button>
        </div>
      </header>
      <main className="relative min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
      {commandOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md" onMouseDown={() => setCommandOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0d14]/95 shadow-[0_32px_120px_rgba(0,0,0,0.65)]" onMouseDown={event => event.stopPropagation()}>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/55">Command Palette</div>
              <div className="mt-2 text-xl font-semibold text-white">跳转 Product Center 工作站</div>
            </div>
            <div className="p-3">
              {commands.map(command => (
                <Link
                  key={command.to}
                  to={command.to}
                  onClick={() => setCommandOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white/88">{command.label}</span>
                    <span className="mt-1 block text-xs text-white/38">{command.hint}</span>
                  </span>
                  <span className="text-xs text-white/28 transition group-hover:translate-x-0.5 group-hover:text-cyan-100">↵</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
