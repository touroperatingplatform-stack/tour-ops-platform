'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  pickup_location: string
  status: 'scheduled' | 'in_progress' | 'completed'
  guide_id: string | null
  guide_name: string
  guest_count: number
  capacity: number
  driver_id: string | null
}

function DriverDashboardContent() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [todayTours, setTodayTours] = useState<Tour[]>([])

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const today = getLocalDate()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('driver_id', user.id)
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (error) {
      console.error('Error loading tours:', error)
      setLoading(false)
      return
    }

    if (data) {
      // Load guide names for each tour
      const toursWithGuides = await Promise.all(
        data.map(async (tour) => {
          let guide_name = 'Unassigned'
          if (tour.guide_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', tour.guide_id)
              .single()
            if (profile) {
              guide_name = `${profile.first_name} ${profile.last_name}`
            }
          }
          return { ...tour, guide_name }
        })
      )
      setTodayTours(toursWithGuides)
    }
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
    
    if (diffMins < 0) return { text: 'Late', urgent: true }
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
      <div className="px-4 py-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Date Header */}
      <section>
        <p className="text-sm text-gray-500 mb-4">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        
        {todayTours.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
            <span className="text-4xl block mb-3">🎉</span>
            <p className="text-gray-900 font-medium text-lg">No tours today</p>
            <p className="text-sm text-gray-500 mt-1">Enjoy your day off</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayTours.map((tour) => {
              const timeInfo = getTimeUntilPickup(tour.start_time)
              return (
                <Link
                  key={tour.id}
                  href={`/driver/tours/${tour.id}`}
                  className="block bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <h2 className="font-semibold text-gray-900 text-lg">{tour.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{tour.pickup_location}</p>
                      {!tour.guide_id && (
                        <p className="text-xs text-amber-600 mt-1">🚗 Transfer Only</p>
                      )}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(tour.status)}`}>
                      {tour.status === 'in_progress' ? 'In Progress' : tour.status === 'scheduled' ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{tour.start_time.slice(0, 5)}</span>
                    </div>
                  </div>
                  
                  {tour.status === 'scheduled' && (
                    <div className={`p-3 rounded-xl text-center text-sm font-medium ${
                      timeInfo.urgent 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      Arrive in {timeInfo.text}
                    </div>
                  )}
                  
                  {tour.status === 'in_progress' && (
                    <div className="p-3 rounded-xl text-center text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                      Tour in progress • Check details
                    </div>
                  )}
                  
                  {tour.status === 'completed' && (
                    <div className="p-3 rounded-xl text-center text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      ✓ Tour completed
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

export default function DriverDashboard() {
  return (
    <DriverNav>
      <DriverDashboardContent />
    </DriverNav>
  )
}
