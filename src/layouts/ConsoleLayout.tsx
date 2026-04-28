import { useEffect, useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
} from 'lucide-react'
import { NAV_TOOL_GROUPS, getLocalizedTool } from '@/mock/data'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { useAuth } from '@/hooks/useAuth'
import { Z_INDEX } from '@/styles/zIndex'

export default function ConsoleLayout() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const language = i18n.resolvedLanguage ?? i18n.language

  const toggleSection = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const apply = (matches: boolean) => {
      setIsDesktop(matches)
      if (matches) {
        setMobileOpen(false)
      }
    }

    apply(media.matches)
    const listener = (event: MediaQueryListEvent) => apply(event.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  const handleSidebarToggle = () => {
    if (isDesktop) {
      setDesktopCollapsed(prev => !prev)
      return
    }

    setMobileOpen(prev => !prev)
  }

  const renderSidebar = (mode: 'desktop' | 'mobile') => {
    const isMobile = mode === 'mobile'
    const compact = isMobile ? false : desktopCollapsed

    return (
    <aside
      className={`fixed inset-y-0 left-0 ${Z_INDEX.sidebar} flex flex-col border-r border-white/[0.06] bg-[#0b0d14]/94 backdrop-blur-xl transition-all duration-300 ${
        isMobile
          ? `w-[min(85vw,18rem)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`
          : `${desktopCollapsed ? 'w-20' : 'w-64'} hidden lg:flex`
      }`}
    >
      <div className={`flex h-14 items-center gap-2 ${compact ? 'justify-center px-3' : 'px-5'}`}>
        <Link to="/" className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-400" />
          {!compact && <span className="text-lg font-bold gradient-text">{t('common.brand')}</span>}
        </Link>
      </div>

      <div className="px-3 pb-3">
        <div className={`glass flex items-center gap-2 rounded-xl px-3 py-2 ${compact ? 'justify-center' : ''}`}>
          <Search className="h-4 w-4 shrink-0 text-white/30" />
          {!compact && (
            <input
              type="text"
              placeholder={t('common.search')}
              className="w-full bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
            />
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4">
        {NAV_TOOL_GROUPS.map(group => (
          <div key={group.label} className="mb-4">
            {!compact && (
              <p className="mb-1 px-3 text-xs uppercase tracking-wider text-white/30">
                {t(group.labelKey)}
              </p>
            )}

            {group.items.map((item: (typeof group.items)[number]) => {
              if ('children' in item && item.children) {
                const sectionLabel = t(item.labelKey)
                const isCollapsed = collapsed[sectionLabel]
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleSection(sectionLabel)}
                      className="sidebar-item w-full text-white/50"
                    >
                      <span>{item.icon}</span>
                      {!compact && (
                        <>
                          <span className="flex-1 text-left">{sectionLabel}</span>
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </>
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className={`${compact ? '' : 'ml-3 border-l border-white/[0.06] pl-2'}`}>
                        {item.children.map((child: (typeof item.children)[number]) => (
                          <NavLink
                            key={child.id}
                            to={`/draw/${child.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                              `sidebar-item${isActive ? ' active' : ''} text-white/50`
                            }
                          >
                            <span>{child.icon}</span>
                            {!compact && <span>{getLocalizedTool(child, language).name}</span>}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <NavLink
                  key={item.label}
                  to={'path' in item ? item.path : '#'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-item${isActive ? ' active' : ''} text-white/50`
                  }
                >
                  <span>{item.icon}</span>
                  {!compact && <span>{t(item.labelKey)}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={`mt-auto border-t border-white/[0.06] py-3 ${compact ? 'px-2' : 'px-4'}`}>
        <button
          onClick={toggleLang}
          className={`flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors ${
            compact ? 'justify-center' : 'gap-2'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {!compact && <span>{i18n.language === 'zh' ? '\u4e2d' : 'EN'}</span>}
        </button>
      </div>
    </aside>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {renderSidebar('desktop')}

      {mobileOpen && (
        <div
          className={`fixed inset-0 ${Z_INDEX.pageOverlay} bg-black/60 lg:hidden`}
          onClick={() => setMobileOpen(false)}
        />
      )}
      {renderSidebar('mobile')}

      <button
        onClick={handleSidebarToggle}
        className={`fixed left-4 top-4 ${Z_INDEX.floatingToolControl} rounded-lg p-2 text-white/60 transition-colors hover:text-white glass`}
      >
        {!isDesktop && mobileOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          isDesktop && desktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      {isAuthenticated && (
        <div className={`fixed right-4 top-4 ${Z_INDEX.floatingToolControl}`}>
          <UserAccountMenu compact={false} />
        </div>
      )}

      <main className={`min-h-screen p-6 transition-[margin] duration-300 ${desktopCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Outlet />
      </main>
    </div>
  )
}
