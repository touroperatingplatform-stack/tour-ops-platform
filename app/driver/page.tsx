'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface TourAssignment {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  guide_name: string
  vehicle?: {
    plate_number: string
    model: string
    capacity: number
  }
}

interface DriverCheckin {
  id: string
  tour_id: string
  checked_in_at: string
  mileage_start: number | null
  fuel_level_before: string | null
  vehicle_condition: string | null
  issues: string | null
}

export default function DriverDashboard() {
  const [loading, setLoading] = useState(true)
  const [todayTours, setTodayTours] = useState<TourAssignment[]>([])
  const [recentCheckins, setRecentCheckins] = useState<DriverCheckin[]>([])
  const [stats, setStats] = useState({
    total_trips: 0,
    pending_issues: 0
  })

  useEffect(() => {
    loadDriverData()
  }, [])

  async function loadDriverData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Get today's assigned tours
      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id, name, tour_date, start_time, status,
          profiles!guide_id (first_name, last_name),
          vehicles (plate_number, model, capacity)
        `)
        .eq('driver_id', user.id)
        .eq('tour_date', today)
        .neq('status', 'cancelled')
        .order('start_time')

      if (toursData) {
        setTodayTours(toursData.map(t => ({
          ...t,
          guide_name: `${t.profiles.first_name} ${t.profiles.last_name}`,
          vehicle: Array.isArray(t.vehicles) ? t.vehicles[0] : t.vehicles
        })))
      }

      // Get recent check-ins
      const { data: checkinsData } = await supabase
        .from('driver_checkins')
        .select('id, tour_id, checked_in_at, mileage_start, fuel_level_before, vehicle_condition, issues')
        .eq('driver_id', user.id)
        .order('checked_in_at', { ascending: false })
        .limit(5)

      setRecentCheckins(checkinsData || [])

      // Get stats
      const { count: tripCount } = await supabase
        .from('driver_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)

      const pendingIssues = checkinsData?.filter(c => c.issues).length || 0

      setStats({
        total_trips: tripCount || 0,
        pending_issues: pendingIssues
      })

    } catch (error) {
      console.error('Error loading driver data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTimeUntilStart(startTime: string) {
    const now = new Date()
    const [hours, minutes] = startTime.split(':').map(Number)
    const startTimeDate = new Date(now)
    startTimeDate.setHours(hours, minutes, 0)
    const diffMs = startTimeDate.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < -30) return { text: 'Started', urgent: false }
    if (diffMins < 0) return { text: 'Starting soon', urgent: true }
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
    <RoleGuard requiredRole="driver">
      <div className="p-4 space-y-6">
        {/* Date Header */}
        <section>
          <p className="text-sm text-gray-500 mb-4">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          
          {todayTours.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
              <span className="text-4xl block mb-3">🎉</span>
              <p className="text-gray-900 font-medium text-lg">No tours assigned today</p>
              <p className="text-sm text-gray-500 mt-1">Check back later or contact operations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTours.map((tour) => {
                const timeInfo = getTimeUntilStart(tour.start_time)
                return (
                  <Link
                    key={tour.id}
                    href={`/driver/checkin?tour_id=${tour.id}`}
                    className="block bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <h2 className="font-semibold text-gray-900 text-lg">{tour.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Guide: {tour.guide_name}</p>
                        {tour.vehicle && (
                          <p className="text-sm text-gray-500">
                            🚗 {tour.vehicle.model} • {tour.vehicle.plate_number}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(tour.status)}`}>
                        {tour.status === 'in_progress' ? 'Live' : 'Upcoming'}
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
                        Start in {timeInfo.text}
                      </div>
                    )}
                    
                    {tour.status === 'in_progress' && (
                      <div className="p-3 rounded-xl text-center text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                        Tour in progress • Complete check-in →
                      </div>
                    )}
                    
                    {tour.status === 'completed' && (
                      <div className="p-3 rounded-xl text-center text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        Tour completed
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stats.total_trips}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </div>
            <div className={`rounded-2xl p-5 border ${
              stats.pending_issues > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-gray-200'
            }`}>
              <p className={`text-2xl font-bold ${
                stats.pending_issues > 0 ? 'text-red-700' : 'text-gray-900'
              }`}>{stats.pending_issues}</p>
              <p className="text-sm text-gray-500">Pending Issues</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="font-semibold text-gray-900 mb-4 text-lg">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/driver/checkin"
              className="bg-white rounded-2xl p-5 border border-gray-200 text-center hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl block mb-2">🚗</span>
              <span className="font-medium text-gray-900">Vehicle Check-in</span>
            </Link>
            <Link 
              href="/driver/history"
              className="bg-white rounded-2xl p-5 border border-gray-200 text-center hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl block mb-2">📜</span>
              <span className="font-medium text-gray-900">Inspection History</span>
            </Link>
          </div>
        </section>

        {/* Recent Check-ins */}
        {recentCheckins.length > 0 && (
          <section>
            <h2 className="font-semibold text-gray-900 mb-4 text-lg">Recent Inspections</h2>
            <div className="space-y-3">
              {recentCheckins.slice(0, 3).map((checkin) => (
                <div key={checkin.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(checkin.checked_in_at).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      checkin.vehicle_condition === 'good' ? 'bg-green-100 text-green-700' :
                      checkin.vehicle_condition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {checkin.vehicle_condition}
                    </span>
                  </div>
                  {checkin.mileage_start && (
                    <p className="text-sm text-gray-600">📍 {checkin.mileage_start} km</p>
                  )}
                  {checkin.fuel_level_before && (
                    <p className="text-sm text-gray-600">⛽ {checkin.fuel_level_before}</p>
                  )}
                  {checkin.issues && (
                    <p className="text-sm text-red-600 mt-2">⚠️ {checkin.issues}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </RoleGuard>
  )
}
