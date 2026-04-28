import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'

const RequireAuth = lazy(() => import('@/components/auth/RequireAuth'))
const RequireOrgAdmin = lazy(() => import('@/components/auth/RequireOrgAdmin'))
const PortalLayout = lazy(() => import('@/layouts/PortalLayout'))
const ConsoleLayout = lazy(() => import('@/layouts/ConsoleLayout'))
const AccountLayout = lazy(() => import('@/layouts/AccountLayout'))
const OrgLayout = lazy(() => import('@/layouts/OrgLayout'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const SolutionDetailPage = lazy(() => import('@/pages/SolutionDetailPage'))
const ToolPage = lazy(() => import('@/pages/ToolPage'))
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'))
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const ApiDocsPage = lazy(() => import('@/pages/ApiDocsPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const ChangelogPage = lazy(() => import('@/pages/ChangelogPage'))
const CareersPage = lazy(() => import('@/pages/CareersPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const AgentTemplateMarketPage = lazy(() => import('@/pages/AgentTemplateMarketPage'))
const ChatWorkspacePage = lazy(() => import('@/pages/ChatWorkspacePage'))
const OpsWorkbenchPage = lazy(() => import('@/pages/OpsWorkbenchPage'))
const AssetCommercePage = lazy(() => import('@/pages/AssetCommercePage'))
const DesignWorkbenchPage = lazy(() => import('@/pages/DesignWorkbenchPage'))
const AccountProfilePage = lazy(() => import('@/pages/account/AccountProfilePage'))
const AccountAssetsPage = lazy(() => import('@/pages/account/AccountAssetsPage'))
const AccountHistoryPage = lazy(() => import('@/pages/account/AccountHistoryPage'))
const AccountTemplatesPage = lazy(() => import('@/pages/account/AccountTemplatesPage'))
const AccountBillingPage = lazy(() => import('@/pages/account/AccountBillingPage'))
const AccountPromotionPage = lazy(() => import('@/pages/account/AccountPromotionPage'))
const AccountCommissionPage = lazy(() => import('@/pages/account/AccountCommissionPage'))
const AccountDownloadsPage = lazy(() => import('@/pages/account/AccountDownloadsPage'))
const OrgOverviewPage = lazy(() => import('@/pages/org/OrgOverviewPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))

function Fallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a12]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <span className="text-sm text-white/40">...</span>
      </div>
    </div>
  )
}

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}

const consolePage = (Element: LazyExoticComponent<ComponentType<any>>) => ({
  element: <S><RequireAuth /></S>,
  children: [{
    element: <S><ConsoleLayout /></S>,
    children: [{ index: true, element: <S><Element /></S> }],
  }],
})

const accountPage = (Element: LazyExoticComponent<ComponentType<any>>) => ({
  element: <S><RequireAuth /></S>,
  children: [{
    element: <S><AccountLayout /></S>,
    children: [{ index: true, element: <S><Element /></S> }],
  }],
})

const orgPage = (Element: LazyExoticComponent<ComponentType<any>>) => ({
  element: <S><RequireOrgAdmin /></S>,
  children: [{
    element: <S><OrgLayout /></S>,
    children: [{ index: true, element: <S><Element /></S> }],
  }],
})

export const router = createBrowserRouter([
  {
    element: <S><PortalLayout /></S>,
    children: [
      { index: true, element: <S><HomePage /></S> },
      { path: 'home', element: <S><HomePage /></S> },
      { path: 'pricing', element: <S><PricingPage /></S> },
      { path: 'solutions/:slug', element: <S><SolutionDetailPage /></S> },
      { path: 'aboutus', element: <S><AboutUsPage /></S> },
      { path: 'help', element: <S><HelpCenterPage /></S> },
      { path: 'api-docs', element: <S><ApiDocsPage /></S> },
      { path: 'blog', element: <S><BlogPage /></S> },
      { path: 'changelog', element: <S><ChangelogPage /></S> },
      { path: 'contact', element: <S><ContactPage /></S> },
      { path: 'careers', element: <S><CareersPage /></S> },
      { path: 'privacy', element: <S><PrivacyPage /></S> },
      { path: 'terms', element: <S><TermsPage /></S> },
      { path: 'login', element: <S><LoginPage /></S> },
      { path: 'register', element: <S><RegisterPage /></S> },
      { path: 'forgot-password', element: <S><ForgotPasswordPage /></S> },
    ],
  },
  { path: '/draw/:toolSlug', ...consolePage(ToolPage) },
  { path: '/chat', ...consolePage(ChatWorkspacePage) },
  { path: '/chat/doc', ...consolePage(ChatWorkspacePage) },
  { path: '/aiChat/template', ...consolePage(AgentTemplateMarketPage) },
  { path: '/aiChat/batchListing', ...consolePage(OpsWorkbenchPage) },
  { path: '/aiChat/history', ...consolePage(OpsWorkbenchPage) },
  { path: '/aiChat/myTemplate', ...consolePage(OpsWorkbenchPage) },
  { path: '/aiChat/analysisRecords', ...consolePage(OpsWorkbenchPage) },
  { path: '/aiChat/training', ...consolePage(OpsWorkbenchPage) },
  { path: '/database/knowledge', ...consolePage(AssetCommercePage) },
  { path: '/database/picturelibrary', ...consolePage(AssetCommercePage) },
  { path: '/brandLibrary', ...consolePage(AssetCommercePage) },
  { path: '/database/sensitiveThesaurus', ...consolePage(AssetCommercePage) },
  { path: '/database/tagManage', ...consolePage(AssetCommercePage) },
  { path: '/draw/scene-reference', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/product-home', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/product-records', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/designer-home', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/my-design', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/my-template', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/team-space', ...consolePage(DesignWorkbenchPage) },
  { path: '/draw/history', ...consolePage(DesignWorkbenchPage) },
  { path: '/settings/profile', element: <Navigate to="/account/profile" replace /> },
  { path: '/settings/personal', element: <Navigate to="/account/assets" replace /> },
  { path: '/settings/organization', element: <Navigate to="/org/overview" replace /> },
  { path: '/orderList', element: <Navigate to="/account/billing" replace /> },
  { path: '/downloadCenter', element: <Navigate to="/account/downloads" replace /> },
  { path: '/account/profile', ...accountPage(AccountProfilePage) },
  { path: '/account/assets', ...accountPage(AccountAssetsPage) },
  { path: '/account/history', ...accountPage(AccountHistoryPage) },
  { path: '/account/templates', ...accountPage(AccountTemplatesPage) },
  { path: '/account/billing', ...accountPage(AccountBillingPage) },
  { path: '/account/promotion', ...accountPage(AccountPromotionPage) },
  { path: '/account/commission', ...accountPage(AccountCommissionPage) },
  { path: '/account/downloads', ...accountPage(AccountDownloadsPage) },
  { path: '/org/overview', ...orgPage(OrgOverviewPage) },
  { path: '*', element: <Navigate to="/" replace /> },
])
