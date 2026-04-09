'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
  const { t } = useTranslation()
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
      case 'in_progress': return t('adminDashboard.live')
      case 'completed': return t('common.done')
      case 'scheduled': return t('common.upcoming')
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('nav.tours')}</h1>
              <p className="text-gray-500 text-sm">{t('adminDashboard.toursToday')}</p>
            </div>
            <Link 
              href="/admin/tours/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + {t('common.add')}
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">{t('common.total')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-gray-500 text-xs">{t('common.active')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.completed}</div>
            <div className="text-gray-500 text-xs">{t('common.done')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          {/* Today's Tours */}
        <div className="mb-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {t('adminDashboard.toursToday')} ({todayTours.length})
          </h2>
          
          <div className="space-y-2">
            {todayTours.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                {t('tours.noToursToday')}
              </div>
            ) : (
              todayTours.map(tour => (
                <div
                  key={tour.id}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🚌</span>
                        <h3 className="font-bold text-lg">{tour.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span>⏰ {tour.start_time?.slice(0, 5)}</span>
                        <span>•</span>
                        <span>👥 {tour.guest_count}/{tour.capacity || '-'} guests</span>
                      </div>
                    </div>
                    <span className={`text-white text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(tour.status)}`}>
                      {getStatusText(tour.status)}
                    </span>
                  </div>
                  
                  {/* Assignment Status */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className={`p-3 rounded-lg ${tour.guide_name === 'Unassigned' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${tour.guide_name === 'Unassigned' ? 'text-red-700' : 'text-green-700'}`}>
                            {tour.guide_name === 'Unassigned' ? '⚠️ No Guide' : tour.guide_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${tour.vehicle_plate === 'No vehicle' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🚐</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${tour.vehicle_plate === 'No vehicle' ? 'text-red-700' : 'text-green-700'}`}>
                            {tour.vehicle_plate === 'No vehicle' ? '⚠️ No Vehicle' : tour.vehicle_plate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tours/${tour.id}`}
                      className="flex-1 py-2 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium text-center hover:bg-blue-100"
                    >
                      View Details
                    </Link>
                    {(tour.guide_name === 'Unassigned' || tour.vehicle_plate === 'No vehicle') && (
                      <Link
                        href={`/admin/tours/${tour.id}/edit`}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-center hover:bg-red-100"
                      >
                        Assign Staff
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming */}
        {upcomingTours.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 text-gray-600">{t('common.upcoming')}</h2>
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
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">👥</span>
            <span className="text-xs">{t('nav.team')}</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-xs">{t('profile.settings')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
