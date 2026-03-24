'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickup_location: string
  guide: { first_name: string; last_name: string } | null
}

export default function TourDetailPage() {
  const params = useParams()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id')
      .eq('id', params.id)
      .single()

    if (tourData && tourData.guide_id) {
      const { data: guide } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', tourData.guide_id)
        .single()
      
      setTour({ ...tourData, guide })
    } else {
      setTour(tourData as any)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tour...</div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tour not found</h1>
        <Link href="/supervisor" className="text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/supervisor" className="text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          tour.status === 'completed' ? 'bg-green-100 text-green-700' :
          tour.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {tour.status.replace('_', ' ')}
        </span>
      </div>

      {/* Tour Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
          <p className="text-lg text-gray-900">{tour.start_time?.slice(0, 5)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Pickup Location</h3>
          <p className="text-lg text-gray-900">{tour.pickup_location || 'Not specified'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Guide</h3>
          <p className="text-lg text-gray-900">
            {tour.guide?.first_name && tour.guide.last_name
              ? `${tour.guide.first_name} ${tour.guide.last_name}`
              : 'No guide assigned'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/supervisor"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
        >
          Back
        </Link>
        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Edit Tour
        </button>
      </div>
    </div>
  )
}
