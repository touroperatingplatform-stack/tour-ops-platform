'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface CompletedTour {
  id: string
  name: string
  tour_date: string
  start_time: string
  completed_at: string
  report_weather: string
  report_guest_satisfaction: string
  report_guest_count: number
  report_cash_received: number
  report_cash_spent: number
  report_cash_to_return: number
  report_highlights: string
  report_issues: string
  report_photos: string[]
  report_incident: string
}

export default function TourHistoryPage() {
  const [tours, setTours] = useState<CompletedTour[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTour, setSelectedTour] = useState<CompletedTour | null>(null)

  useEffect(() => {
    loadCompletedTours()
  }, [])

  async function loadCompletedTours() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('tours')
      .select(`
        id, name, tour_date, start_time, completed_at,
        report_weather, report_guest_satisfaction, report_guest_count,
        report_cash_received, report_cash_spent, report_cash_to_return,
        report_highlights, report_issues, report_photos, report_incident
      `)
      .eq('guide_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50)

    if (data) setTours(data)
    setLoading(false)
  }

  const satisfactionEmojis: Record<string, string> = {
    excellent: '😍',
    good: '🙂',
    average: '😐',
    poor: '😕',
    terrible: '😡',
  }

  const weatherEmojis: Record<string, string> = {
    sunny: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    storm: '⛈️',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading history...</div>
      </div>
    )
  }

  if (selectedTour) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 pb-24">
        <div className="mb-4">
          <button 
            onClick={() => setSelectedTour(null)}
            className="text-blue-600 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back to history
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedTour.name}</h1>
          <p className="text-gray-500 text-sm">
            {new Date(selectedTour.tour_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {selectedTour.start_time?.slice(0, 5)}
          </p>
        </div>

        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tour Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Weather</p>
                <p className="font-medium text-lg">
                  {weatherEmojis[selectedTour.report_weather] || '🌤️'} {selectedTour.report_weather}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Guest Satisfaction</p>
                <p className="font-medium text-lg">
                  {satisfactionEmojis[selectedTour.report_guest_satisfaction] || '🙂'} {selectedTour.report_guest_satisfaction}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Guest Count</p>
                <p className="font-medium">{selectedTour.report_guest_count} PAX</p>
              </div>
              <div>
                <p className="text-gray-500">Cash Reconciliation</p>
                <p className="font-medium">
                  ${selectedTour.report_cash_received || 0} → ${selectedTour.report_cash_to_return || 0} return
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          {selectedTour.report_highlights && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Highlights</h2>
              <p className="text-gray-700">{selectedTour.report_highlights}</p>
            </div>
          )}

          {/* Issues */}
          {selectedTour.report_issues && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Issues</h2>
              <p className="text-gray-700">{selectedTour.report_issues}</p>
            </div>
          )}

          {/* Incident */}
          {selectedTour.report_incident && selectedTour.report_incident !== 'none' && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
              <h2 className="font-semibold text-red-700 mb-2">Incident Reported</h2>
              <p className="text-red-600">{selectedTour.report_incident}</p>
            </div>
          )}

          {/* Photos */}
          {selectedTour.report_photos && selectedTour.report_photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Tour Photos</h2>
              <div className="grid grid-cols-2 gap-2">
                {selectedTour.report_photos.map((photo, idx) => (
                  <img 
                    key={idx} 
                    src={photo} 
                    alt={`Tour photo ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Download Receipt */}
          <button
            onClick={() => alert('Receipt download feature coming soon!')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            📄 Download Receipt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tour History</h1>
        <p className="text-gray-500 text-sm mt-1">Your completed tours</p>
      </div>

      {tours.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No completed tours yet</p>
          <Link href="/guide" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tours.map((tour) => (
            <button
              key={tour.id}
              onClick={() => setSelectedTour(tour)}
              className="w-full bg-white rounded-2xl border border-gray-200 p-5 text-left hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{tour.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(tour.tour_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl">
                    {satisfactionEmojis[tour.report_guest_satisfaction] || '🙂'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-600">
                  {weatherEmojis[tour.report_weather] || '🌤️'} {tour.report_weather}
                </span>
                <span className="text-gray-600">
                  👥 {tour.report_guest_count || '?'} PAX
                </span>
                {tour.report_incident && tour.report_incident !== 'none' && (
                  <span className="text-red-600">⚠️ Incident</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Link
        href="/guide"
        className="block text-center text-gray-600 hover:text-gray-900 text-sm py-6"
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}
