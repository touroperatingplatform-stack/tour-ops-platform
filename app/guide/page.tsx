'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  first_name: string
  last_name: string
}

interface Tour {
  id: string
  name: string
  description: string
  tour_date: string
  start_time: string
  pickup_location: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  guest_count: number
  capacity: number
}

export default function GuideDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayTours, setTodayTours] = useState<Tour[]>([])
  const [upcomingTours, setUpcomingTours] = useState<Tour[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', session.user.id)
      .single()

    if (profileData) setProfile(profileData)

    // Load today's tours
    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await supabase
      .from('tours')
      .select('*')
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (todayData) setTodayTours(todayData)

    // Load upcoming tours (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const { data: upcomingData } = await supabase
      .from('tours')
      .select('*')
      .gt('tour_date', today)
      .lte('tour_date', nextWeek.toISOString().split('T')[0])
      .neq('status', 'cancelled')
      .order('tour_date')
      .limit(5)

    if (upcomingData) setUpcomingTours(upcomingData)

    setLoading(false)
  }

  function getTimeUntilPickup(startTime: string) {
    const now = new Date()
    const [hours, minutes] = startTime.split(':').map(Number)
    const pickupTime = new Date(now)
    pickupTime.setHours(hours, minutes, 0)
    
    // Pickup is 20 min before start
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
      cancelled: 'bg-red-100 text-red-800',
    }
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      in_progress: 'Live',
      completed: 'Done',
      cancelled: 'Cancelled',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium sticky top-0 z-50">
          📡 Offline mode - changes will sync when online
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Hi {profile?.first_name || 'Guide'} 👋
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/profile" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {profile?.first_name?.[0] || 'G'}
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Today's Tours */}
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
                    className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm active:scale-99 transition-transform"
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
                        <span className="text-2xl">👥</span>
                        <span className="font-medium">{tour.guest_count}/{tour.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-2xl">🕐</span>
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

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-left active:scale-95 transition-transform">
              <span className="text-2xl block mb-2">📝</span>
              <span className="font-medium text-gray-900">Report Issue</span>
            </button>
            <button className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-left active:scale-95 transition-transform">
              <span className="text-2xl block mb-2">💵</span>
              <span className="font-medium text-gray-900">Add Expense</span>
            </button>
          </div>
        </section>

        {/* Upcoming Tours */}
        {upcomingTours.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Upcoming
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {upcomingTours.map((tour, i) => (
                <Link
                  key={tour.id}
                  href={`/guide/tours/${tour.id}`}
                  className={`flex items-center justify-between p-4 ${i !== upcomingTours.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{tour.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(tour.tour_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' • '}
                      {tour.start_time.slice(0, 5)}
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-50">
        <div className="flex justify-around items-center">
          <Link href="/guide" className="flex flex-col items-center gap-1 p-2 text-blue-600">
            <span className="text-xl">🚌</span>
            <span className="text-xs font-medium">Tours</span>
          </Link>
          <Link href="/guide/activity" className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
