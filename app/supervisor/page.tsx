'use client'

export const dynamic = 'force-dynamic'

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
  tour_date: string
  started_at: string | null
}

interface Incident {
  id: string
  type: string
  severity: string
  status: string
  created_at: string
}

export default function SupervisorDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    
    // Load tours
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id, tour_date, started_at')
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

    // Load active incidents
    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, type, severity, status, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    setTours(toursWithGuide)
    setIncidents(incidentsData || [])
    setLoading(false)
  }

  const liveTours = tours.filter(t => t.status === 'in_progress')
  const todayTours = tours
  const completedTours = tours.filter(t => t.status === 'completed')
  const scheduledTours = tours.filter(t => t.status === 'scheduled')

  // Find late tours (scheduled but past start time by 15+ minutes)
  const now = new Date()
  const lateTours = scheduledTours.filter(tour => {
    const [hours, minutes] = tour.start_time.split(':').map(Number)
    const startTime = new Date()
    startTime.setHours(hours, minutes, 0)
    const diffMs = now.getTime() - startTime.getTime()
    return diffMs > 15 * 60 * 1000 // 15 minutes late
  })

  // Find tours starting soon (within 30 minutes)
  const upcomingTours = scheduledTours.filter(tour => {
    const [hours, minutes] = tour.start_time.split(':').map(Number)
    const startTime = new Date()
    startTime.setHours(hours, minutes, 0)
    const diffMs = startTime.getTime() - now.getTime()
    return diffMs > 0 && diffMs < 30 * 60 * 1000
  })

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* ALERTS SECTION */}
      {(lateTours.length > 0 || incidents.length > 0 || upcomingTours.length > 0) && (
        <div className="space-y-2">
          {/* Late Tours Alert */}
          {lateTours.map((tour) => (
            <div key={`late-${tour.id}`} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800">Late Tour: {tour.name}</p>
                  <p className="text-sm text-red-600">
                    Started at {tour.start_time?.slice(0, 5)} • Guide: {tour.guide?.first_name || 'Unassigned'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Upcoming Tours Alert */}
          {upcomingTours.slice(0, 2).map((tour) => (
            <div key={`upcoming-${tour.id}`} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-semibold text-yellow-800">Starting Soon: {tour.name}</p>
                  <p className="text-sm text-yellow-600">
                    {tour.start_time?.slice(0, 5)} • {tour.guide?.first_name || 'No guide assigned'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Active Incidents Alert */}
          {incidents.slice(0, 2).map((incident) => (
            <Link 
              key={`incident-${incident.id}`} 
              href="/supervisor/incidents"
              className="block bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg hover:bg-orange-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <p className="font-semibold text-orange-800 capitalize">{incident.severity} Priority: {incident.type}</p>
                  <p className="text-sm text-orange-600">
                    Reported {new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-600 rounded-2xl p-4 text-white text-center">
          <p className="text-3xl font-bold">{liveTours.length}</p>
          <p className="text-blue-100 text-sm">Live</p>
        </div>
        <div className="bg-gray-700 rounded-2xl p-4 text-white text-center">
          <p className="text-3xl font-bold">{todayTours.length}</p>
          <p className="text-gray-300 text-sm">Today</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-4 text-white text-center">
          <p className="text-3xl font-bold">{completedTours.length}</p>
          <p className="text-green-100 text-sm">Done</p>
        </div>
      </div>

      {/* Live Tours */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3 text-lg">Live Tours</h2>
        
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
                className="block bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                    LIVE
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {tour.guide?.first_name} {tour.guide?.last_name} • {tour.pickup_location}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Today's Schedule */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-lg">Today's Schedule</h2>
          <Link href="/supervisor/tours" className="text-blue-600 text-sm font-medium">See All →</Link>
        </div>

        <div className="space-y-3">
          {todayTours.slice(0, 5).map((tour) => (
            <div 
              key={tour.id}
              className="bg-white rounded-2xl p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tour.name}</p>
                  <p className="text-sm text-gray-500">
                    {tour.start_time?.slice(0, 5)} • {tour.guide?.first_name || 'No guide'} • {tour.pickup_location}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${
                  tour.status === 'completed' ? 'bg-green-100 text-green-700' : 
                  tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  lateTours.find(t => t.id === tour.id) ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {lateTours.find(t => t.id === tour.id) ? 'LATE' : tour.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
          {todayTours.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
              <p className="text-gray-500">No tours scheduled today</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3 text-lg">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            href="/supervisor/incidents"
            className="bg-white rounded-2xl p-4 border border-gray-200 text-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl block mb-2">🚨</span>
            <span className="font-medium text-gray-900">Incidents</span>
            {incidents.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {incidents.length}
              </span>
            )}
          </Link>
          <Link 
            href="/supervisor/guides"
            className="bg-white rounded-2xl p-4 border border-gray-200 text-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl block mb-2">👥</span>
            <span className="font-medium text-gray-900">Guides</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
