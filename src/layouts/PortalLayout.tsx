import { useState, useEffect, useRef } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, ChevronDown, Layers, Zap, Globe, BrainCircuit } from 'lucide-react'
import { NAV_TOOL_GROUPS, TOOL_CATEGORIES, TOOLS, getLocalizedTool } from '@/mock/data'
import { useAuth } from '@/hooks/useAuth'
import UserAccountMenu, { getUserDisplayName } from '@/components/account/UserAccountMenu'
import { logoutAuth } from '@/state/auth'
import { getAuthAwareLoginPath, getAuthAwareStartPath } from '@/utils/authNavigation'
import { Z_INDEX } from '@/styles/zIndex'

export default function PortalLayout() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, user } = useAuth({ refreshOnMount: false })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<string>(TOOL_CATEGORIES[0].key)
  const megaRef = useRef<HTMLDivElement>(null)
  const megaTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  const SOLUTIONS_LINKS = [
    { label: t('solutions.boutique'), to: '/solutions/boutique' },
    { label: t('solutions.multipleStores'), to: '/solutions/multipleStores' },
    { label: t('solutions.creativeCustomized'), to: '/solutions/creativeCustomized' },
    { label: t('solutions.clothing'), to: '/solutions/clothing' },
  ]

  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = language.startsWith('en') ? 'en' : 'zh'
  const loginPath = getAuthAwareLoginPath(isAuthenticated)
  const startPath = getAuthAwareStartPath(isAuthenticated)

  const FOOTER_COLUMNS = [
    {
      title: t('footer.products'),
      links: TOOL_CATEGORIES.map(c => ({ label: t(c.labelKey), to: `/products/workbench/visual-tools/${TOOLS.find(tool => tool.category === c.key)?.slug ?? ''}` })),
    },
    {
      title: t('footer.solutions'),
      links: SOLUTIONS_LINKS,
    },
    {
      title: t('footer.resources'),
      links: [
        { label: t('footer.helpCenter'), to: '/help' },
        { label: t('footer.apiDocs'), to: '/api-docs' },
        { label: t('footer.blog'), to: '/blog' },
        { label: t('footer.changelog'), to: '/changelog' },
      ],
    },
    {
      title: t('footer.about'),
      links: [
        { label: t('footer.aboutUs'), to: '/aboutus' },
        { label: t('footer.contactUs'), to: '/contact' },
        { label: t('footer.joinUs'), to: '/careers' },
        { label: t('footer.privacy'), to: '/privacy' },
      ],
    },
  ]

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleMegaEnter = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current)
    setMegaOpen(true)
  }

  const handleMegaLeave = () => {
    megaTimer.current = setTimeout(() => setMegaOpen(false), 150)
  }

  const filteredTools = TOOLS.filter(tool => tool.category === activeCat)

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a12]">
      <nav className={`fixed top-0 inset-x-0 ${Z_INDEX.portalNav} isolate border-b border-white/[0.08] bg-[#0a0c12]/88 backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[72px] px-4 sm:px-6 safe-area-inset">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-[170px]">
            <Layers className="w-6 h-6 text-brand-400" />
            <span className="text-xl font-bold gradient-text">{t('common.brand')}</span>
          </Link>

          <div className="hidden lg:flex items-center justify-center gap-1 flex-1 px-8">
            <div
              ref={megaRef}
              className="relative"
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">
                {t('nav.products')}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute top-full left-1/2 ${Z_INDEX.dropdown} -translate-x-1/2 pt-3 transition-all duration-200 ${
                  megaOpen ? 'visible translate-y-0 opacity-100 pointer-events-auto' : 'invisible -translate-y-2 opacity-0 pointer-events-none'
                }`}
              >
                <div className="w-[680px] rounded-2xl border border-white/[0.12] bg-[#0d1018]/98 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.7)] backdrop-blur-2xl flex gap-5">
                  <div className="w-48 shrink-0 space-y-1">
                    <Link
                      to="/products"
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-500/15 text-brand-400"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      <span className="font-medium text-sm">{t('home.dashboard.hero_title')} {t('home.dashboard.hero_highlight')}</span>
                    </Link>
                    <div className="my-2 border-t border-white/[0.06]" />
                    {TOOL_CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        onMouseEnter={() => setActiveCat(cat.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          activeCat === cat.key
                            ? 'bg-brand-500/15 text-brand-400'
                            : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
                        }`}
                      >
                        <span>{t(cat.labelKey)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-1.5 content-start max-h-80 overflow-y-auto scrollbar-hide">
                    {filteredTools.map(tool => {
                      const localizedTool = getLocalizedTool(tool, language)

                      return (
                        <Link
                          key={tool.id}
                          to={`/products/workbench/visual-tools/${tool.slug}`}
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors group"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-white/80 group-hover:text-white truncate">{localizedTool.name}</div>
                            <div className="text-xs text-white/30 truncate">{localizedTool.desc}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/solutions/boutique"
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            >
              {t('nav.solutions')}
            </Link>
            <Link
              to="/pricing"
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              to="/aboutus"
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            >
              {t('nav.aboutUs')}
            </Link>
          </div>

          <div className="hidden lg:flex items-center justify-end gap-2 min-w-[250px]">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors rounded-lg hover:bg-white/[0.06]"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{i18n.language === 'zh' ? '\u4e2d' : 'EN'}</span>
            </button>
            {isAuthenticated ? (
              <UserAccountMenu compact />
            ) : (
              <>
                <Link to={loginPath} className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2">
                  {t('common.login')}
                </Link>
                <Link to={startPath} className="btn-primary px-5 py-2 rounded-full text-sm font-semibold text-white">
                  {t('common.signup')}
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(prev => !prev)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className={`fixed inset-0 ${Z_INDEX.pageOverlay} bg-[#0a0a12]/95 backdrop-blur-xl transition-all duration-300 lg:hidden`}>
          <div className="h-full overflow-y-auto px-6 pb-8 pt-20 safe-area-inset">
            <div className="space-y-1">
              <p className="mb-2 px-3 text-xs uppercase tracking-wider text-white/30">{t('nav.products')}</p>
              {NAV_TOOL_GROUPS.map(group => (
                <div key={group.label} className="mb-4">
                  <p className="mb-1 px-3 text-xs text-white/40">{t(group.labelKey)}</p>
                  {group.items.map((item: (typeof group.items)[number]) => {
                    if ('children' in item && item.children) {
                      return item.children.map((tool: (typeof item.children)[number]) => (
                        <Link
                          key={tool.id}
                          to={`/products/workbench/visual-tools/${tool.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="sidebar-item"
                        >
                          <span>{getLocalizedTool(tool, language).name}</span>
                        </Link>
                      ))
                    }
                    return (
                      <Link
                        key={item.label}
                        to={'path' in item ? item.path : '#'}
                        onClick={() => setMobileOpen(false)}
                        className="sidebar-item"
                      >
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}

              <div className="my-4 h-px bg-white/10" />

              <Link to="/solutions/boutique" onClick={() => setMobileOpen(false)} className="sidebar-item">
                {t('nav.solutions')}
              </Link>
              <Link to="/pricing" onClick={() => setMobileOpen(false)} className="sidebar-item">
                {t('nav.pricing')}
              </Link>
              <Link to="/aboutus" onClick={() => setMobileOpen(false)} className="sidebar-item">
                {t('nav.aboutUs')}
              </Link>

              <div className="my-4 h-px bg-white/10" />

              <div className="flex flex-col gap-3 px-3 pt-2">
                <button
                  onClick={toggleLang}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                >
                  <Globe className="h-4 w-4" />
                  <span>{i18n.language === 'zh' ? '\u4e2d' : 'EN'}</span>
                </button>
                {isAuthenticated ? (
                  <>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                      <div className="text-sm font-semibold text-white">{getUserDisplayName(user, locale)}</div>
                      <div className="mt-1 text-xs text-white/45">{user?.email}</div>
                    </div>
                    <Link to="/aiChat/template" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm text-white/70 hover:text-white">
                      {locale === 'zh' ? '模板市场' : 'Template Market'}
                    </Link>
                    <Link to="/account/profile" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm text-white/70 hover:text-white">
                      {locale === 'zh' ? '账户资料' : 'Account Profile'}
                    </Link>
                    <button
                      onClick={() => {
                        logoutAuth()
                        setMobileOpen(false)
                      }}
                      className="py-2.5 text-center text-sm text-white/70 hover:text-white"
                    >
                      {t('common.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={loginPath} onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm text-white/70 hover:text-white">
                      {t('common.login')}
                    </Link>
                    <Link to={startPath} onClick={() => setMobileOpen(false)} className="btn-primary rounded-xl py-2.5 text-center text-sm font-semibold text-white">
                      {t('common.signup')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-white/[0.06] bg-[#070710]">
        <div className="max-w-7xl mx-auto px-6 py-16 safe-area-inset">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {FOOTER_COLUMNS.map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-400" />
              <span className="text-sm font-semibold gradient-text">{t('common.brand')}</span>
            </div>
            <p className="text-xs text-white/30">{t('common.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
                <Zap className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
