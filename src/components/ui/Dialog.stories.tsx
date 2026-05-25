import { Button } from './Button'
import { Dialog } from './Dialog'

export default {
  title: 'Ecommerce UI/Dialog',
  component: Dialog,
}

export function Default() {
  return (
    <div className="min-h-[360px] bg-[var(--ecom-bg)] p-6">
      <Dialog title="Confirm Style Change" description="Global style changes require migration evidence and an accepted decision.">
        <p className="text-sm leading-relaxed text-[var(--ecom-text-secondary)]">This dialog uses shared border, radius, shadow, and focus primitives.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Accept</Button>
        </div>
      </Dialog>
    </div>
  )
}
