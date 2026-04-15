'use client'

export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'

// TODO: Implement Edit Tour Product
// - Load product by ID
// - Same form as new page
// - Show which tours use this product
// - Option to deactivate (not delete if in use)
// - Manage activities:
//   - Add/remove activities
//   - Reorder activities
//   - View activity checklists

export default function EditTourProductPage() {
  const params = useParams()
  const productId = params.id as string

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Edit Tour Product</h1>
      <p className="text-gray-500 mt-2">
        Product ID: {productId}
      </p>
      <p className="text-gray-400 text-sm mt-4">
        Implementation pending. This will allow editing the product definition,
        managing activities, and viewing which tours use this product.
      </p>
    </div>
  )
}
