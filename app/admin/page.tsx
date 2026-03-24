'use client'

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
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{stats.tours}</p>
          <p className="text-blue-100 text-sm">Today's Tours</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-green-100 text-sm">Active Now</p>
        </div>
      </div>

      {/* Today's Tours */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Today's Tours</h2>
          <Link href="/admin/tours" className="text-blue-600 text-sm">See All →</Link>
        </div>

        <div className="space-y-3">
          {todayTours.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
              <p className="text-gray-500">No tours today</p>
            </div>
          ) : (
            todayTours.map((tour) => (
              <Link
                key={tour.id}
                href={`/admin/tours/${tour.id}`}
                className="block bg-white rounded-2xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{tour.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tour.status === 'in_progress' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tour.status === 'in_progress' ? 'Live' : tour.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  🕐 {tour.start_time?.slice(0, 5)} • 👥 {tour.guest_count}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
