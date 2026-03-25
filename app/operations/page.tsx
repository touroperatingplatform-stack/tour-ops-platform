'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  pickup_location: string
  guest_count: number
  guide: { first_name: string; last_name: string } | null
}

export default function OperationsDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guest_count, guide_id')
      .eq('tour_date', today)
      .order('start_time')

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

  const scheduled = tours.filter(t => t.status === 'scheduled').length
  const inProgress = tours.filter(t => t.status === 'in_progress').length
  const completed = tours.filter(t => t.status === 'completed').length
  const totalGuests = tours.reduce((sum, t) => sum + (t.guest_count || 0), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{scheduled + inProgress}</p>
          <p className="text-blue-100 text-sm">Active Tours</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{completed}</p>
          <p className="text-green-100 text-sm">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{totalGuests}</p>
          <p className="text-purple-100 text-sm">Total Guests</p>
        </div>
        <div className="bg-orange-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{tours.length}</p>
          <p className="text-orange-100 text-sm">Today's Tours</p>
        </div>
      </div>

      {/* Today's Timeline */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Today's Timeline</h2>
        
        {tours.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
            <p className="text-gray-500">No tours scheduled today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/admin/tours/${tour.id}`}
                className={`block rounded-2xl p-4 border ${
                  tour.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                  tour.status === 'completed' ? 'bg-green-50 border-green-200' :
                  'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-700">{tour.start_time?.slice(0, 5)}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tour.status}
                    </span>
                  </div>
                </div>
                
                <p className="font-semibold text-gray-900">{tour.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>📍 {tour.pickup_location}</span>
                  <span>👥 {tour.guest_count || 0}</span>
                </div>
                
                <div className="mt-2">
                  {tour.guide ? (
                    <span className="text-sm text-green-700">
                      👤 {tour.guide.first_name} {tour.guide.last_name}
                    </span>
                  ) : (
                    <span className="text-sm text-orange-600">⚠️ No guide assigned</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
