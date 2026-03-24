'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  pickup_location: string
  status: 'scheduled' | 'in_progress' | 'completed'
  guest_count: number
  capacity: number
}

export default function GuideDashboard() {
  const [loading, setLoading] = useState(true)
  const [todayTours, setTodayTours] = useState<Tour[]>([])

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data } = await supabase
      .from('tours')
      .select('*')
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (data) setTodayTours(data)
    setLoading(false)
  }

  function getTimeUntilPickup(startTime: string) {
    const now = new Date()
    const [hours, minutes] = startTime.split(':').map(Number)
    const pickupTime = new Date(now)
    pickupTime.setHours(hours, minutes, 0)
    const arrivalTime = new Date(pickupTime.getTime() - 20 * 60 * 1000)
    const diffMs = arrivalTime.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 0) return { text: 'LATE', urgent: true }
    if (diffMins < 30) return { text: `${diffMins}m`, urgent: true }
    return { text: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`, urgent: false }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return styles[status] || 'bg-gray-100'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-gray-500 mb-3">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        
        {todayTours.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
            <span className="text-4xl block mb-3">🎉</span>
            <p className="text-gray-900 font-medium">No tours today</p>
            <p className="text-sm text-gray-500 mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTours.map((tour) => {
              const timeInfo = getTimeUntilPickup(tour.start_time)
              return (
                <Link
                  key={tour.id}
                  href={`/guide/tours/${tour.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{tour.name}</h2>
                      <p className="text-sm text-gray-500">{tour.pickup_location}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tour.status)}`}>
                      {tour.status === 'in_progress' ? 'Live' : 'Upcoming'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{tour.start_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{tour.guest_count}</span>
                    </div>
                  </div>
                  
                  {tour.status === 'scheduled' && (
                    <div className={`mt-3 p-2.5 rounded-lg text-center text-sm font-medium ${
                      timeInfo.urgent 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      Arrive in {timeInfo.text}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
