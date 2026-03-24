'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickup_location: string
  guide: { first_name: string; last_name: string } | null
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id')
      .order('start_time', { ascending: false })

    const toursWithGuide = await Promise.all((toursData || []).map(async (tour: any) => {
      let guide = null
      if (tour.guide_id) {
        const { data: g } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', tour.guide_id)
          .single()
        guide = g
      }
      return { ...tour, guide }
    }))

    setTours(toursWithGuide)
    setLoading(false)
  }

  const filteredTours = filter === 'all' 
    ? tours 
    : tours.filter(t => t.status === filter)

  const statusCounts = {
    all: tours.length,
    scheduled: tours.filter(t => t.status === 'scheduled').length,
    in_progress: tours.filter(t => t.status === 'in_progress').length,
    completed: tours.filter(t => t.status === 'completed').length,
    cancelled: tours.filter(t => t.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tours...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Tours</h1>
        <p className="text-gray-500 mt-1">Manage and monitor all tours</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl p-3 text-center transition-all ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs capitalize">{key.replace('_', ' ')}</p>
          </button>
        ))}
      </div>

      {/* Tours List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filteredTours.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No tours found</p>
            <p className="text-sm">Try adjusting your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTours.map((tour) => (
              <Link
                key={tour.id}
                href={`/supervisor/tours/${tour.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tour.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tour.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {tour.start_time?.slice(0, 5)} • {tour.pickup_location || 'No location'}
                    </p>
                    {tour.guide && (
                      <p className="text-xs text-gray-400 mt-1">
                        Guide: {tour.guide.first_name} {tour.guide.last_name}
                      </p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
