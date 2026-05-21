import { Star } from 'lucide-react'

export function ComplexityStars({ level }: { level: number }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
        />
      ))}
    </div>
  )
}
