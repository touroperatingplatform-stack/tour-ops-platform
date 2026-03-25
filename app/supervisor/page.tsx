'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LiveMap from './components/LiveMap'

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

export default function SupervisorDashboard() {
  const [todayTours, setTodayTours] = useState<TourWithGuide[]>([])
  const [pendingExpenses, setPendingExpenses] = useState(0)
  const [pendingIncidents, setPendingIncidents] = useState(0)
  const [activeGuides, setActiveGuides] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Real-time subscription
    const subscription = supabase
      .channel('supervisor_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tours' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        loadDashboardData()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]
    
    // Tours
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id, name, tour_date, start_time, status, pickup_location, guest_count,
        guide:guide_id (id, first_name, last_name, email)
      `)
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) setTodayTours(toursData as TourWithGuide[])

    // Active guides (on tour today)
    const { count: activeCount } = await supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
    setActiveGuides(activeCount || 0)

    // Pending expenses
    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
    setPendingExpenses(expensesCount || 0)

    // Open incidents
    const { count: incidentsCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact' })
      .in('status', ['reported', 'acknowledged', 'in_progress'])
    setPendingIncidents(incidentsCount || 0)

    setLoading(false)
  }

  const activeTours = todayTours.filter(t => t.status === 'in_progress')
  const scheduledTours = todayTours.filter(t => t.status === 'scheduled')
  const completedToday = todayTours.filter(t => t.status === 'completed').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link 
            href="/guide" 
            className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Switch to Guide View
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <Link href="/supervisor/guides" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
            <p className="text-sm text-gray-500">Active Guides</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{activeGuides}</p>
            <p className="text-xs text-gray-400 mt-1">on tours today</p>
          </Link>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{activeTours.length}</p>
            <p className="text-xs text-gray-400 mt-1">tours active now</p>
          </div>

          <Link href="/supervisor/expenses" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <p className="text-sm text-gray-500">Pending Expenses</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-bold text-orange-600">{pendingExpenses}</p>
              {pendingExpenses > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">needs review</span>
              )}
            </div>
          </Link>

          <Link href="/supervisor/incidents" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 transition-colors">
            <p className="text-sm text-gray-500">Open Incidents</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-bold text-red-600">{pendingIncidents}</p>
              {pendingIncidents > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">needs attention</span>
              )}
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Map - Takes 2 columns */}
          <div className="lg:col-span-2">
            <LiveMap />
          </div>

          {/* Today's Activity - Takes 1 column */}
          <div className="space-y-6">
            {/* Scheduled Tours */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📋 Scheduled ({scheduledTours.length})
              </h2>
              <div className="space-y-3">
                {scheduledTours.slice(0, 5).map(tour => (
                  <div key={tour.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{tour.start_time?.slice(0, 5)} {tour.name}</p>
                      <p className="text-sm text-gray-500">{tour.guide.first_name} {tour.guide.last_name}</p>
                    </div>
                    <span className="text-sm text-gray-400">{tour.guest_count} guests</span>
                  </div>
                ))}
                {scheduledTours.length === 0 && (
                  <p className="text-gray-400 text-sm">No scheduled tours</p>
                )}
              </div>
            </div>

            {/* Active Tours */}
            {activeTours.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  In Progress ({activeTours.length})
                </h2>
                <div className="space-y-3">
                  {activeTours.map(tour => (
                    <div key={tour.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div>
                        <p className="font-medium text-gray-900">{tour.name}</p>
                        <p className="text-sm text-gray-600">{tour.guide.first_name} {tour.guide.last_name}</p>
                      </div>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Today */}
            {completedToday > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-500 mb-4">✓ Completed Today ({completedToday})</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
