import { EcomCommandDialog, EcomHeader, EcomNavPill, EcomShell } from './EcomShell'

export default {
  title: 'Ecommerce UI/EcomShell',
  component: EcomShell,
}

export function ShellAndHeader() {
  return (
    <EcomShell>
      <EcomHeader>
        <div className="text-sm font-semibold">Agent Ecommerce</div>
        <nav className="flex items-center gap-2" aria-label="Demo navigation">
          <EcomNavPill active>Product Center</EcomNavPill>
          <EcomNavPill>Production</EcomNavPill>
          <EcomNavPill>Account</EcomNavPill>
        </nav>
      </EcomHeader>
      <main className="relative mx-auto max-w-4xl p-6">
        <section className="rounded-[var(--ecom-radius-xl)] border border-[var(--ecom-border)] bg-[var(--ecom-surface)] p-6">
          <h1 className="text-xl font-semibold">Unified Product Surface</h1>
          <p className="mt-2 text-sm text-[var(--ecom-text-secondary)]">Shell, header, and nav primitives share the same semantic tokens.</p>
        </section>
      </main>
    </EcomShell>
  )
}

export function CommandDialog() {
  return (
    <EcomShell>
      <EcomCommandDialog>
        <div className="p-5">
          <h2 className="text-base font-semibold">Command Dialog</h2>
          <p className="mt-2 text-sm text-[var(--ecom-text-secondary)]">Dialog surface uses shared radius, border, and shadow tokens.</p>
        </div>
      </EcomCommandDialog>
    </EcomShell>
  )
}
