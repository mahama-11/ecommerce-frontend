import { useParams } from 'react-router-dom'

export default function ToolPage() {
  const { toolSlug } = useParams()
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-xl font-bold text-white">Tool: {toolSlug}</h1>
    </div>
  )
}

export function ProductScopedToolPage() {
  const { productId, toolSlug } = useParams()
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-xl font-bold text-white">Product {productId} — Tool: {toolSlug}</h1>
    </div>
  )
}
