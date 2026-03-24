'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  todayTours: number
  activeTours: number
  pendingExpenses: number
  pendingTimeOff: number
}

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  guide: { first_name: string; last_name: string } | null
  guest_count: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    todayTours: 0,
    activeTours: 0,
    pendingExpenses: 0,
    pendingTimeOff: 0,
  })
  const [todayTours, setTodayTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]

    // Today's tours
    const { data: toursData } = await supabase
      .from('tours')
      .select('*, guide:guide_id(first_name, last_name)')
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) {
      setTodayTours(toursData)
      setStats(prev => ({
        ...prev,
        todayTours: toursData.length,
        activeTours: toursData.filter(t => t.status === 'in_progress').length,
      }))
    }

    // Pending expenses
    const { count: expensesCount } = await supabase
      .from('tour_expenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Pending time off
    const { count: timeOffCount } = await supabase
      .from('time_off_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    setStats(prev => ({
      ...prev,
      pendingExpenses: expensesCount || 0,
      pendingTimeOff: timeOffCount || 0,
    }))

    setLoading(false)
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link 
            href="/admin/settings" 
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl"
          >
            ⚙️
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/tours" className="bg-blue-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{stats.todayTours}</p>
            <p className="text-blue-100 text-sm">Today's Tours</p>
          </Link>
          
          <div className="bg-green-500 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{stats.activeTours}</p>
            <p className="text-green-100 text-sm">Active Now</p>
          </div>
          
          <Link href="/admin/expenses" className="bg-orange-500 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{stats.pendingExpenses}</p>
            <p className="text-orange-100 text-sm">Expenses</p>
          </Link>
          
          <Link href="/admin/guides/availability" className="bg-purple-500 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{stats.pendingTimeOff}</p>
            <p className="text-purple-100 text-sm">Time Off</p>
          </Link>
        </div>

        {/* Today's Tours */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Today's Tours</h2>
            <Link href="/admin/tours" className="text-blue-600 text-sm font-medium">
              See All →
            </Link>
          </div>

          <div className="space-y-3">
            {todayTours.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
                <p className="text-4xl mb-2">🌴</p>
                <p className="text-gray-500">No tours today</p>
              </div>
            ) : (
              todayTours.map((tour) => (
                <Link
                  key={tour.id}
                  href={`/admin/tours/${tour.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{tour.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tour.status)}`}>
                      {tour.status === 'in_progress' ? 'Live' : tour.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>🕐 {tour.start_time?.slice(0, 5)}</span>
                    <span>👤 {tour.guide?.first_name} {tour.guide?.last_name?.[0]}</span>
                    <span>👥 {tour.guest_count}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link 
              href="/admin/tours/new"
              className="bg-white rounded-2xl p-4 border border-gray-200 text-center active:scale-95 transition-transform"
            >
              <span className="text-2xl block mb-1">➕</span>
              <span className="text-xs font-medium text-gray-700">New Tour</span>
            </Link>
            <Link 
              href="/admin/users/new"
              className="bg-white rounded-2xl p-4 border border-gray-200 text-center active:scale-95 transition-transform"
            >
              <span className="text-2xl block mb-1">👤</span>
              <span className="text-xs font-medium text-gray-700">Add User</span>
            </Link>
            <Link 
              href="/admin/vehicles/new"
              className="bg-white rounded-2xl p-4 border border-gray-200 text-center active:scale-95 transition-transform"
            >
              <span className="text-2xl block mb-1">🚐</span>
              <span className="text-xs font-medium text-gray-700">Add Vehicle</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
