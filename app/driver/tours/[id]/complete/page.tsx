'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

function CompleteContent() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string
  
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)

    try {
      await supabase.from('tours').update({
        status: 'completed'
      }).eq('id', tourId)

      router.push('/driver')
    } catch (error) {
      console.error('Error completing tour:', error)
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">Complete Tour?</h1>
      <p className="text-gray-600 mb-6">
        Mark this tour as completed. This will finalize the tour record.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Completing...' : '✓ Mark as Completed'}
        </button>

        <Link
          href={`/driver/tours/${tourId}`}
          className="block w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-lg"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}

export default function CompletePage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <CompleteContent />
      </DriverNav>
    </RoleGuard>
  )
}
