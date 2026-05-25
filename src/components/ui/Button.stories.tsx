import { Button, ButtonLink, ExternalButtonLink } from './Button'

export default {
  title: 'Ecommerce UI/Button',
  component: Button,
}

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[var(--ecom-bg)] p-6">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary Action</Button>
      <Button variant="ghost">Ghost Action</Button>
      <Button variant="quiet">Quiet Action</Button>
      <Button variant="danger">Danger Action</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[var(--ecom-bg)] p-6">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon-sm" aria-label="Refresh">↻</Button>
    </div>
  )
}

export function LinkButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[var(--ecom-bg)] p-6">
      <ButtonLink to="/products" variant="primary">Internal Link</ButtonLink>
      <ExternalButtonLink href="https://example.com" target="_blank" rel="noreferrer">External Link</ExternalButtonLink>
    </div>
  )
}
