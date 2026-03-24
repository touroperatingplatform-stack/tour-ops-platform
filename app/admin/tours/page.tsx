'use client'

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
  guide_id: string | null
  vehicle_id: string | null
  guide: { full_name: string } | null
  vehicle: { plate_number: string; model: string } | null
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        guide:profiles!guide_id(full_name),
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

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tours...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
          <p className="text-gray-500 mt-1">Manage tour schedules</p>
        </div>
        <Link
          href="/admin/tours/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Create Tour</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => { setDateFilter(''); setStatusFilter('all') }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTours.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No tours found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tour</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Guide</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Guests</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{tour.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{new Date(tour.tour_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{tour.start_time}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {tour.guide?.full_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {tour.vehicle ? `${tour.vehicle.plate_number} (${tour.vehicle.model})` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {tour.guest_count || 0} / {tour.capacity || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(tour.status)}`}>
                        {tour.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/tours/${tour.id}`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link 
                          href={`/admin/tours/edit/${tour.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredTours.length} of {tours.length} tours
      </div>
    </div>
  )
}
