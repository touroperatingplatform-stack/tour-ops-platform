'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  guest_count: number
  capacity: number
  guide_name: string
  vehicle_plate: string
}

export default function ToursPage() {
  const [todayTours, setTodayTours] = useState<Tour[]>([])
  const [upcomingTours, setUpcomingTours] = useState<Tour[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const today = getLocalDate()
    
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id, name, tour_date, start_time, status, guest_count, capacity,
        guide:profiles!guide_id(first_name, last_name),
        vehicle:vehicles!vehicle_id(plate_number)
      `)
      .gte('tour_date', today)
      .order('tour_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20)

    if (toursData) {
      const formatted = toursData.map((t: any) => ({
        ...t,
        guide_name: t.guide ? `${t.guide.first_name} ${t.guide.last_name}` : 'Unassigned',
        vehicle_plate: t.vehicle?.plate_number || 'No vehicle'
      }))

      setTodayTours(formatted.filter((t: Tour) => t.tour_date === today))
      setUpcomingTours(formatted.filter((t: Tour) => t.tour_date > today).slice(0, 5))
      
      setStats({
        total: formatted.length,
        active: formatted.filter((t: Tour) => t.status === 'in_progress').length,
        completed: formatted.filter((t: Tour) => t.status === 'completed').length
      })
    }
    
    setLoading(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress': return 'bg-green-500'
      case 'completed': return 'bg-gray-400'
      case 'scheduled': return 'bg-blue-500'
      default: return 'bg-gray-300'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'in_progress': return 'Live'
      case 'completed': return 'Done'
      case 'scheduled': return 'Upcoming'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading tours...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Tours</h1>
            <p className="text-gray-500 text-sm">Manage your tours</p>
          </div>
          <Link 
            href="/admin/tours/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            + New
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-gray-500 text-xs">Active</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.completed}</div>
            <div className="text-gray-500 text-xs">Done</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {/* Today's Tours */}
        <div className="mb-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Today's Tours ({todayTours.length})
          </h2>
          
          <div className="space-y-2">
            {todayTours.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                No tours today
              </div>
            ) : (
              todayTours.map(tour => (
                <Link
                  key={tour.id}
                  href={`/admin/tours/${tour.id}`}
                  className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{tour.name}</h3>
                      <p className="text-gray-500 text-sm">{tour.start_time?.slice(0, 5)}</p>
                    </div>
                    <span className={`text-white text-xs px-2 py-1 rounded-full ${getStatusColor(tour.status)}`}>
                      {getStatusText(tour.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👤 {tour.guide_name}</span>
                    <span>🚌 {tour.vehicle_plate}</span>
                    <span>👥 {tour.guest_count}/{tour.capacity}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming */}
        {upcomingTours.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 text-gray-600">Upcoming</h2>
            <div className="space-y-2">
              {upcomingTours.map(tour => (
                <Link
                  key={tour.id}
                  href={`/admin/tours/${tour.id}`}
                  className="block bg-white rounded-xl shadow p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{tour.name}</h3>
                      <p className="text-gray-500 text-sm">{tour.tour_date} at {tour.start_time?.slice(0, 5)}</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
