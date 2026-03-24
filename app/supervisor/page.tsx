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

export default function SupervisorDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id')
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

  const liveTours = tours.filter(t => t.status === 'in_progress')
  const todayTours = tours
  const completedTours = tours.filter(t => t.status === 'completed')

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
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-600 rounded-2xl p-3 text-white text-center">
          <p className="text-2xl font-bold">{liveTours.length}</p>
          <p className="text-blue-100 text-xs">Live</p>
        </div>
        <div className="bg-gray-700 rounded-2xl p-3 text-white text-center">
          <p className="text-2xl font-bold">{todayTours.length}</p>
          <p className="text-gray-300 text-xs">Today</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-3 text-white text-center">
          <p className="text-2xl font-bold">{completedTours.length}</p>
          <p className="text-green-100 text-xs">Done</p>
        </div>
      </div>

      {/* Live Tours */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Live Tours</h2>
        
        {liveTours.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
            <p className="text-gray-500">No tours currently in progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {liveTours.map((tour) => (
              <Link
                key={tour.id}
                href={`/supervisor/tours/${tour.id}`}
                className="block bg-blue-50 rounded-2xl p-4 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                  <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                    LIVE
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {tour.guide?.first_name} {tour.guide?.last_name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Today's Schedule */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
          <Link href="/supervisor/tours" className="text-blue-600 text-sm">See All →</Link>
        </div>

        <div className="space-y-3">
          {todayTours.slice(0, 5).map((tour) => (
            <div 
              key={tour.id}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{tour.name}</p>
                  <p className="text-sm text-gray-500">{tour.start_time?.slice(0, 5)} • {tour.guide?.first_name || 'No guide'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tour.status === 'completed' ? 'bg-green-100 text-green-700' : 
                  tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {tour.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
