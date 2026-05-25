import { Button } from './Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'

export default {
  title: 'Ecommerce UI/Card',
  component: Card,
}

export function Surfaces() {
  return (
    <div className="grid gap-4 bg-[var(--ecom-bg)] p-6 md:grid-cols-3">
      {(['default', 'raised', 'subtle'] as const).map(surface => (
        <Card key={surface} surface={surface}>
          <CardHeader>
            <CardTitle>{surface} Card</CardTitle>
            <CardDescription>Reusable card surface with semantic product tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ecom-text-secondary)]">Use cards for grouped workflow information, not one-off page styling.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
