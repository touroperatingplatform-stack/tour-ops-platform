'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  pickup_location: string
  status: string
  guest_count: number
  report_weather: string | null
  report_guest_satisfaction: string | null
  report_highlights: string | null
  report_photos: string[] | null
  completed_at: string | null
}

export default function TourHistoryPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, completed, cancelled
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)

  useEffect(() => {
    loadTours()
  }, [filter])

  async function loadTours() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('tours')
      .select('*')
      .eq('guide_id', userData.user.id)
      .order('tour_date', { ascending: false })

    if (filter === 'completed') {
      query = query.eq('status', 'completed')
    } else if (filter === 'cancelled') {
      query = query.eq('status', 'cancelled')
    } else {
      query = query.in('status', ['completed', 'cancelled'])
    }

    const { data } = await query.limit(50)

    if (data) setTours(data)
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  // Report Modal
  if (selectedTour) {
    return (
      <div className="px-4 py-4">
        <button 
          onClick={() => setSelectedTour(null)}
          className="flex items-center gap-2 text-gray-600 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Tour Report</h1>
            <p className="text-green-100">{selectedTour.name} • {formatDate(selectedTour.tour_date)}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Weather */}
            {selectedTour.report_weather && (
              <div>
                <label className="text-sm font-medium text-gray-500">Weather</label>
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {selectedTour.report_weather.replace('_', ' ')}
                </p>
              </div>
            )}

            {/* Guest Satisfaction */}
            {selectedTour.report_guest_satisfaction && (
              <div>
                <label className="text-sm font-medium text-gray-500">Guest Satisfaction</label>
                <div className={`inline-block px-4 py-2 rounded-full font-medium ${
                  selectedTour.report_guest_satisfaction === 'excellent' ? 'bg-green-100 text-green-700' :
                  selectedTour.report_guest_satisfaction === 'good' ? 'bg-blue-100 text-blue-700' :
                  selectedTour.report_guest_satisfaction === 'average' ? 'bg-yellow-100 text-yellow-700' :
                  selectedTour.report_guest_satisfaction === 'poor' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedTour.report_guest_satisfaction.charAt(0).toUpperCase() + 
                   selectedTour.report_guest_satisfaction.slice(1)}
                </div>
              </div>
            )}

            {/* Highlights */}
            {selectedTour.report_highlights && (
              <div>
                <label className="text-sm font-medium text-gray-500">Highlights</label>
                <p className="text-gray-900 mt-1">{selectedTour.report_highlights}</p>
              </div>
            )}

            {/* Photos */}
            {selectedTour.report_photos && selectedTour.report_photos.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-3 block">Photos</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTour.report_photos.map((photo, idx) => (
                    <img 
                      key={idx}
                      src={photo}
                      alt={`Tour photo ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No report message */}
            {!selectedTour.report_weather && !selectedTour.report_highlights && 
             (!selectedTour.report_photos || selectedTour.report_photos.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No detailed report was submitted for this tour.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tour History</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Tours</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tours List */}
      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <span className="text-4xl block mb-3">📜</span>
          <p className="text-gray-900 font-medium">No tours found</p>
          <p className="text-sm text-gray-500 mt-1">Your completed tours will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <div 
              key={tour.id}
              className="bg-white rounded-2xl p-5 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{tour.name}</h2>
                  <p className="text-sm text-gray-500">{formatDate(tour.tour_date)} • {tour.start_time?.slice(0, 5)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tour.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {tour.status === 'completed' ? 'Completed' : 'Cancelled'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>👥 {tour.guest_count} guests</span>
                <span>📍 {tour.pickup_location}</span>
              </div>

              <div className="flex gap-2">
                {tour.status === 'completed' && (
                  <button
                    onClick={() => setSelectedTour(tour)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                  >
                    View Report
                  </button>
                )}
                <Link
                  href={`/guide/tours/${tour.id}`}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
