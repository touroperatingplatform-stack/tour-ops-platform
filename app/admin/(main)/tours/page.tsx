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

type FilterTab = 'today' | 'upcoming' | 'past' | 'all'

export default function ToursPage() {
  const { t } = useTranslation()
  const [tours, setTours] = useState<Tour[]>([])
  const [filteredTours, setFilteredTours] = useState<Tour[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('today')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTours()
  }, [activeTab])

  useEffect(() => {
    applyFilters()
  }, [tours, statusFilter, searchQuery])

  async function loadTours() {
    setLoading(true)
    const today = getLocalDate()

    let query = supabase
      .from('tours')
      .select(`
        id, name, tour_date, start_time, status, guest_count, capacity,
        guide:profiles!guide_id(first_name, last_name, full_name),
        vehicle:vehicles!vehicle_id(plate_number)
      `)
      .order('tour_date', { ascending: activeTab === 'upcoming' })
      .order('start_time', { ascending: true })

    // Apply date filters based on tab
    if (activeTab === 'today') {
      query = query.eq('tour_date', today)
    } else if (activeTab === 'upcoming') {
      query = query.gt('tour_date', today)
    } else if (activeTab === 'past') {
      query = query.lt('tour_date', today)
    }
    // 'all' shows everything

    const { data: toursData } = await query.limit(100)

    if (toursData) {
      const formatted = toursData.map((t: any) => ({
        ...t,
        guide_name: t.guide?.first_name 
          ? `${t.guide.first_name} ${t.guide.last_name || ''}` 
          : t.guide?.full_name || 'Unassigned',
        vehicle_plate: t.vehicle?.plate_number || 'No vehicle'
      }))

      setTours(formatted)
      
      setStats({
        total: formatted.length,
        active: formatted.filter((t: Tour) => t.status === 'in_progress').length,
        completed: formatted.filter((t: Tour) => t.status === 'completed').length
      })
    }
    
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...tours]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.guide_name.toLowerCase().includes(query) ||
        t.vehicle_plate.toLowerCase().includes(query)
      )
    }

    setFilteredTours(filtered)
  }

  async function handleDeleteTour(tourId: string) {
    if (!confirm('Delete this tour? This cannot be undone.')) return
    
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', tourId)
    
    if (error) {
      alert('Error deleting tour: ' + error.message)
    } else {
      loadTours()
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress': return 'bg-green-500'
      case 'completed': return 'bg-gray-400'
      case 'scheduled': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'in_progress': return t('adminDashboard.live')
      case 'completed': return t('common.done')
      case 'scheduled': return t('common.upcoming')
      case 'cancelled': return t('common.cancelled') || 'Cancelled'
      default: return status
    }
  }

  function getTabLabel(tab: FilterTab) {
    switch (tab) {
      case 'today': return t('adminDashboard.toursToday') || "Today's Tours"
      case 'upcoming': return t('common.upcoming') || 'Upcoming'
      case 'past': return t('common.past') || 'Past'
      case 'all': return t('common.all') || 'All Tours'
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
              <p className="text-gray-500 text-sm">{filteredTours.length} {t('common.tours') || 'tours'}</p>
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

      {/* Filter Tabs */}
      <div className="px-4 pb-2 flex-shrink-0 border-8 border-transparent">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['today', 'upcoming', 'past', 'all'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex-shrink-0 border-8 border-transparent">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">{t('common.allStatuses') || 'All Statuses'}</option>
            <option value="scheduled">{t('common.scheduled') || 'Scheduled'}</option>
            <option value="in_progress">{t('common.inProgress') || 'In Progress'}</option>
            <option value="completed">{t('common.completed') || 'Completed'}</option>
            <option value="cancelled">{t('common.cancelled') || 'Cancelled'}</option>
          </select>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('common.search') || 'Search tours...'}
          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex-shrink-0 border-8 border-transparent">
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
          {filteredTours.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              {t('tours.noToursFound') || 'No tours found'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTours.map(tour => (
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
                      <div className="flex items-center gap-2 text-gray-500 text-sm flex-wrap">
                        <span>📅 {tour.tour_date}</span>
                        <span>•</span>
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
                      {t('common.view') || 'View'}
                    </Link>
                    {(tour.guide_name === 'Unassigned' || tour.vehicle_plate === 'No vehicle') && tour.status !== 'completed' && tour.status !== 'cancelled' && (
                      <Link
                        href={`/admin/tours/edit/${tour.id}`}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-center hover:bg-red-100"
                      >
                        {t('common.assign') || 'Assign'}
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteTour(tour.id)}
                      className="py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      {t('common.delete') || 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
