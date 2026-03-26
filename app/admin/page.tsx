'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  guest_count: number
}

export default function AdminDashboard() {
  const [todayTours, setTodayTours] = useState<Tour[]>([])
  const [stats, setStats] = useState({ tours: 0, active: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]

    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guest_count')
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (tours) {
      setTodayTours(tours)
      setStats({
        tours: tours.length,
        active: tours.filter(t => t.status === 'in_progress').length,
        expenses: 0,
      })
    }

    setLoading(false)
  }

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
      {/* Date */}
      <p className="text-sm text-gray-500">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/tours" className="bg-blue-600 rounded-2xl p-4 text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.tours}</p>
          <p className="text-blue-100 text-sm">Today's Tours</p>
        </Link>
        
        <div className="bg-green-500 rounded-2xl p-4 text-white shadow-sm">
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-green-100 text-sm">Active Now</p>
        </div>
      </div>

      {/* Today's Tours */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Tours Today</h2>
          <Link href="/admin/tours" className="text-blue-600 text-sm font-medium">See All →</Link>
        </div>

        <div className="space-y-3">
          {todayTours.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
              <p className="text-gray-500">No tours scheduled today</p>
            </div>
          ) : (
            todayTours.map((tour) => (
              <Link
                key={tour.id}
                href={`/admin/tours/${tour.id}`}
                className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tour.status === 'in_progress' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tour.status === 'in_progress' ? 'Live' : 'Scheduled'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{tour.start_time?.slice(0, 5)}</span>
                  <span>•</span>
                  <span>{tour.guest_count} guests</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link 
            href="/admin/tours/new"
            className="bg-white p-4 rounded-2xl border border-gray-200 text-center hover:border-blue-300 transition-colors"
          >
            <span className="text-2xl block mb-1">➕</span>
            <span className="font-medium text-gray-900 text-sm">New Tour</span>
          </Link>
          <Link 
            href="/admin/users/new"
            className="bg-white p-4 rounded-2xl border border-gray-200 text-center hover:border-blue-300 transition-colors"
          >
            <span className="text-2xl block mb-1">👤</span>
            <span className="font-medium text-gray-900 text-sm">Add User</span>
          </Link>
          <Link 
            href="/admin/data"
            className="bg-white p-4 rounded-2xl border border-gray-200 text-center hover:border-blue-300 transition-colors"
          >
            <span className="text-2xl block mb-1">📊</span>
            <span className="font-medium text-gray-900 text-sm">Export/Import</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
