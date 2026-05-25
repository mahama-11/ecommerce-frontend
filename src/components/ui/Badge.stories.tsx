import { Badge } from './Badge'

export default {
  title: 'Ecommerce UI/Badge',
  component: Badge,
}

export function Tones() {
  return (
    <div className="flex flex-wrap gap-2 bg-[var(--ecom-bg)] p-6">
      <Badge>Neutral</Badge>
      <Badge tone="cyan">Cyan</Badge>
      <Badge tone="emerald">Success</Badge>
      <Badge tone="amber">Warning</Badge>
      <Badge tone="rose">Danger</Badge>
    </div>
  )
}

export function Variants() {
  return (
    <div className="flex flex-wrap gap-2 bg-[var(--ecom-bg)] p-6">
      <Badge tone="cyan" variant="soft">Soft</Badge>
      <Badge tone="cyan" variant="outline">Outline</Badge>
      <Badge tone="cyan" variant="solid">Solid</Badge>
    </div>
  )
}
