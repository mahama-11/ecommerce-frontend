import { useParams } from 'react-router-dom'

export default function SolutionDetailPage() {
  const { slug } = useParams()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-bold text-white">Solution: {slug}</h1>
    </div>
  )
}
