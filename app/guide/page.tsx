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
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status === 'in_progress' ? 'Live' : status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Today's Tours
        </h2>
        
        {todayTours.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-500">No tours today</p>
            <p className="text-sm text-gray-400 mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTours.map((tour) => {
              const timeInfo = getTimeUntilPickup(tour.start_time)
              return (
                <Link
                  key={tour.id}
                  href={`/guide/tours/${tour.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{tour.name}</h3>
                      <p className="text-sm text-gray-500">{tour.pickup_location}</p>
                    </div>
                    {getStatusBadge(tour.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span>👥</span>
                      <span className="font-medium">{tour.guest_count}/{tour.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>🕐</span>
                      <span className="font-medium">{tour.start_time.slice(0, 5)}</span>
                    </div>
                  </div>
                  
                  {tour.status === 'scheduled' && (
                    <div className={`mt-3 p-2 rounded-lg text-center text-sm font-medium ${
                      timeInfo.urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
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

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            href="/guide/activity"
            className="bg-white p-4 rounded-2xl border border-gray-200 text-center"
          >
            <span className="text-2xl block mb-2">💬</span>
            <span className="font-medium text-gray-900 text-sm">Team Chat</span>
          </Link>
          <button className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
            <span className="text-2xl block mb-2">💵</span>
            <span className="font-medium text-gray-900 text-sm">Add Expense</span>
          </button>
        </div>
      </section>
    </div>
  )
}
