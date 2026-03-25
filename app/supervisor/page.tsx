'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface TourWithGuide {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  guide: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  pickup_location: string
  guest_count: number
  started_at?: string
  completed_at?: string
}

interface PendingItem {
  type: 'expense' | 'incident'
  count: number
}

export default function SupervisorDashboard() {
  const [todayTours, setTodayTours] = useState<TourWithGuide[]>([])
  const [pendingExpenses, setPendingExpenses] = useState(0)
  const [pendingIncidents, setPendingIncidents] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]
    
    // Load today's tours with guide info
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id, name, tour_date, start_time, status, pickup_location, guest_count, started_at, completed_at,
        guide:guide_id (id, first_name, last_name, email)
      `)
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) {
      setTodayTours(toursData as TourWithGuide[])
    }

    // Count pending expenses
    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')

    setPendingExpenses(expensesCount || 0)

    // Count open incidents
    const { count: incidentsCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact' })
      .in('status', ['reported', 'acknowledged', 'in_progress'])

    setPendingIncidents(incidentsCount || 0)
    setLoading(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress': return 'bg-green-100 text-green-700 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'in_progress': return '🟢 Active'
      case 'completed': return '✅ Done'
      case 'scheduled': return '⏳ Scheduled'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  const activeTours = todayTours.filter(t => t.status === 'in_progress')
  const completedTours = todayTours.filter(t => t.status === 'completed')
  const scheduledTours = todayTours.filter(t => t.status === 'scheduled')

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500">Total Tours</p>
            <p className="text-3xl font-bold text-gray-900">{todayTours.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500">Active Now</p>
            <p className="text-3xl font-bold text-green-600">{activeTours.length}</p>
          </div>
          
          <Link href="/supervisor/expenses" className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 transition-colors">
            <p className="text-sm text-gray-500">Pending Expenses</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-orange-600">{pendingExpenses}</p>
              {pendingExpenses > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">needs review</span>
              )}
            </div>
          </Link>
          
          <Link href="/supervisor/incidents" className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-red-300 transition-colors">
            <p className="text-sm text-gray-500">Open Incidents</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-red-600">{pendingIncidents}</p>
              {pendingIncidents > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">needs attention</span>
              )}
            </div>
          </Link>
          
          <Link href="/supervisor/guides" className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 transition-colors">
            <p className="text-sm text-gray-500">Guides</p>
            <p className="text-3xl font-bold text-blue-600">👥</p>
          </Link>
        </div>

        {/* Tours Section */}
        <div className="space-y-6">
          {/* Active Tours */}
          {activeTours.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Active Tours ({activeTours.length})
              </h2>
              <div className="space-y-3">
                {activeTours.map(tour => (
                  <div key={tour.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {tour.start_time?.slice(0, 5)} • {tour.pickup_location}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-gray-700">
                            👤 {tour.guide.first_name} {tour.guide.last_name}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {tour.guest_count} guests
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tour.status)}`}>
                        {getStatusLabel(tour.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Scheduled Tours */}
          {scheduledTours.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-3">Scheduled ({scheduledTours.length})</h2>
              <div className="space-y-3">
                {scheduledTours.map(tour => (
                  <div key={tour.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {tour.start_time?.slice(0, 5)} • {tour.pickup_location}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          👤 {tour.guide.first_name} {tour.guide.last_name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tour.status)}`}>
                        {getStatusLabel(tour.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Tours */}
          {completedTours.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-3 text-gray-500">Completed Today ({completedTours.length})</h2>
              <div className="space-y-3">
                {completedTours.slice(0, 3).map(tour => (
                  <div key={tour.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-700">{tour.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {tour.start_time?.slice(0, 5)} • {tour.guide.first_name} {tour.guide.last_name}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">✓ Done</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
