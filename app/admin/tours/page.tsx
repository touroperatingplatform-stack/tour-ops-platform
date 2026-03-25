'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  guest_count: number
  capacity: number
  pickup_location: string
  guide_id: string | null
  vehicle_id: string | null
  guide: { first_name: string; last_name: string } | null
  vehicle: { plate_number: string; model: string } | null
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        guide:profiles!guide_id(first_name, last_name),
        vehicle:vehicles!vehicle_id(plate_number, model)
      `)
      .order('tour_date', { ascending: false })

    if (error) {
      console.error('Error loading tours:', error)
    } else {
      setTours(data || [])
    }
    setLoading(false)
  }

  const filteredTours = tours.filter((tour) => {
    const matchesDate = !dateFilter || tour.tour_date === dateFilter
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter
    return matchesDate && matchesStatus
  })

  // Group tours by date
  const groupedTours = filteredTours.reduce((acc, tour) => {
    const date = tour.tour_date
    if (!acc[date]) acc[date] = []
    acc[date].push(tour)
    return acc
  }, {} as Record<string, Tour[]>)

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    if (dateStr === today) return 'Today'
    if (dateStr === tomorrow) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse mb-4"></div>
        <div className="space-y-3">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
          <p className="text-gray-500 mt-1">Manage tour schedules and operations</p>
        </div>
        <Link
          href="/admin/tours/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <span className="text-xl">➕</span>
          <span>Create Tour</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{tours.filter(t => t.status === 'scheduled').length}</p>
          <p className="text-sm text-blue-600">Scheduled</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{tours.filter(t => t.status === 'in_progress').length}</p>
          <p className="text-sm text-yellow-600">In Progress</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{tours.filter(t => t.status === 'completed').length}</p>
          <p className="text-sm text-green-600">Completed</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">{tours.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              ⊞ Grid
            </button>
          </div>
          
          <button
            onClick={() => { setDateFilter(''); setStatusFilter('all') }}
            className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tours List */}
      {filteredTours.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <span className="text-4xl block mb-3">🚌</span>
          <p className="text-gray-900 font-medium text-lg">No tours found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="space-y-6">
          {Object.entries(groupedTours).map(([date, dateTours]) => (
            <div key={date}>
              <h2 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-gray-100 py-2 px-4 rounded-lg">
                {formatDate(date)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateTours.map((tour) => (
                  <div key={tour.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getStatusBadgeColor(tour.status)}`}>
                        {tour.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{tour.start_time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="truncate">{tour.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>{tour.guide ? `${tour.guide.first_name} ${tour.guide.last_name}` : 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🚐</span>
                        <span>{tour.vehicle?.plate_number || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{tour.guest_count || 0} / {tour.capacity || 'N/A'} guests</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/tours/${tour.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/tours/edit/${tour.id}`}
                        className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-medium text-center hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Tour</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Date & Time</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Guide</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Vehicle</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Guests</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{tour.name}</p>
                      <p className="text-sm text-gray-500">{tour.pickup_location}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="font-medium">{formatDate(tour.tour_date)}</div>
                      <div className="text-sm text-gray-500">{tour.start_time?.slice(0, 5)}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {tour.guide ? `${tour.guide.first_name} ${tour.guide.last_name}` : <span className="text-red-500">Unassigned</span>}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {tour.vehicle ? (
                        <span>{tour.vehicle.plate_number}</span>
                      ) : (
                        <span className="text-red-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {tour.guest_count || 0} / {tour.capacity || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${getStatusBadgeColor(tour.status)}`}>
                        {tour.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/admin/tours/${tour.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/admin/tours/edit/${tour.id}`}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredTours.length} of {tours.length} tours
      </div>
    </div>
  )
}
