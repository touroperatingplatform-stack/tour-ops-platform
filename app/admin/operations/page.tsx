'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet map (SSR safe)
const TourMap = dynamic(() => import('@/components/TourMap'), { ssr: false })

type CheckinType = 'pre_departure' | 'pickup' | 'activity' | 'dropoff' | 'office_return'

interface Checkin {
  id: string
  tour_id: string
  guide_id: string
  pickup_stop_id: string | null
  checkin_type: CheckinType
  checked_in_at: string
  latitude: number | null
  longitude: number | null
  selfie_url: string | null
  scheduled_time: string | null
  minutes_early_or_late: number | null
  notes: string | null
}

interface Tour {
  id: string
  name: string
  tour_date: string
  status: string
  guide_id: string | null
  guides: { full_name: string } | null
  brand_id: string
  brands: { name: string } | null
}

interface Stop {
  id: string
  tour_id: string
  location_name: string
  latitude: number | null
  longitude: number | null
  scheduled_time: string | null
  stop_type: string
  sort_order: number
}

interface TourWithCheckins extends Tour {
  checkins: Checkin[]
  stops: Stop[]
}

export default function OperationsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [tours, setTours] = useState<TourWithCheckins[]>([])
  const [selectedTour, setSelectedTour] = useState<TourWithCheckins | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function loadData() {
    setLoading(true)

    // Fetch tours for selected date
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id,
        name,
        tour_date,
        status,
        guide_id,
        brand_id,
        guides:guide_id (full_name),
        brands:brand_id (name)
      `)
      .eq('tour_date', selectedDate)
      .order('start_time')

    if (!toursData) {
      setLoading(false)
      return
    }

    // Fetch all checkins for these tours
    const tourIds = toursData.map((t: any) => t.id)
    const { data: checkinsData } = await supabase
      .from('guide_checkins')
      .select('*')
      .in('tour_id', tourIds)
      .order('checked_in_at')

    // Fetch all stops for these tours
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('*')
      .in('tour_id', tourIds)
      .order('sort_order')

    // Combine data
    const toursWithCheckins: TourWithCheckins[] = toursData.map((tour: any) => ({
      ...tour,
      guides: Array.isArray(tour.guides) ? tour.guides[0] : tour.guides,
      brands: Array.isArray(tour.brands) ? tour.brands[0] : tour.brands,
      checkins: (checkinsData || []).filter((c: Checkin) => c.tour_id === tour.id),
      stops: (stopsData || []).filter((s: Stop) => s.tour_id === tour.id),
    }))

    setTours(toursWithCheckins)
    setLoading(false)
  }

  const checkinTypeLabels: Record<CheckinType, string> = {
    pre_departure: '🚗 Pre-Departure',
    pickup: '📍 Pickup',
    activity: '🎯 Activity',
    dropoff: '🏁 Dropoff',
    office_return: '🏢 Office Return',
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-700',
    acknowledged: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  // Get all points for map (stops + checkins)
  const mapPoints = selectedTour
    ? [
        // Scheduled stops
        ...selectedTour.stops.map((stop) => ({
          lat: stop.latitude,
          lng: stop.longitude,
          name: stop.location_name,
          type: 'stop' as const,
          scheduled_time: stop.scheduled_time,
          stop_type: stop.stop_type,
        })),
        // Actual checkins
        ...selectedTour.checkins.map((checkin) => ({
          lat: checkin.latitude,
          lng: checkin.longitude,
          name: checkinTypeLabels[checkin.checkin_type],
          type: 'checkin' as const,
          checked_in_at: checkin.checked_in_at,
          selfie_url: checkin.selfie_url,
          minutes_early_or_late: checkin.minutes_early_or_late,
        })),
      ].filter((p) => p.lat && p.lng)
    : []

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-gray-500 text-sm">Track tours and guide checkins in real-time</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Sidebar - Tour List */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t border-gray-200">
            <div className="p-3 text-xs font-semibold text-gray-500 uppercase">Tours ({tours.length})</div>

            {loading ? (
              <div className="p-4 text-gray-500">Loading...</div>
            ) : tours.length === 0 ? (
              <div className="p-4 text-gray-500">No tours scheduled</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tours.map((tour) => {
                  const isSelected = selectedTour?.id === tour.id
                  const lastCheckin = tour.checkins[tour.checkins.length - 1]

                  return (
                    <button
                      key={tour.id}
                      onClick={() => setSelectedTour(isSelected ? null : tour)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tour.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {tour.guides?.full_name || 'No guide assigned'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {tour.brands?.name}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[tour.status] || 'bg-gray-100'}`}>
                          {tour.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{tour.checkins.length} / {tour.stops.length} stops</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${tour.stops.length > 0 ? (tour.checkins.length / tour.stops.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Last checkin */}
                      {lastCheckin && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last: {checkinTypeLabels[lastCheckin.checkin_type]} at{' '}
                          {new Date(lastCheckin.checked_in_at).toLocaleTimeString()}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTour ? (
            <>
              {/* Map */}
              <div className="flex-1 relative">
                <TourMap
                  points={mapPoints}
                  tourName={selectedTour.name}
                />
              </div>

              {/* Timeline */}
              <div className="h-64 bg-white border-t border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Timeline</h2>

                  {selectedTour.checkins.length === 0 ? (
                    <div className="text-gray-500 text-sm">No checkins yet</div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTour.checkins.map((checkin) => {
                        const minutes = checkin.minutes_early_or_late
                        const isLate = minutes !== null && minutes > 5
                        const isEarly = minutes !== null && minutes < -5

                        return (
                          <div key={checkin.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-lg">
                                {checkin.checkin_type === 'pre_departure' && '🚗'}
                                {checkin.checkin_type === 'pickup' && '📍'}
                                {checkin.checkin_type === 'activity' && '🎯'}
                                {checkin.checkin_type === 'dropoff' && '🏁'}
                                {checkin.checkin_type === 'office_return' && '🏢'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {checkinTypeLabels[checkin.checkin_type]}
                                </span>
                                {minutes !== null && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    isLate ? 'bg-red-100 text-red-700' :
                                    isEarly ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {minutes > 0 ? `+${minutes} min` : `${minutes} min`}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(checkin.checked_in_at).toLocaleTimeString()}
                              </div>
                              {checkin.notes && (
                                <div className="text-xs text-gray-400 mt-1">{checkin.notes}</div>
                              )}
                            </div>
                            {checkin.selfie_url && (
                              <img
                                src={checkin.selfie_url}
                                alt="Checkin selfie"
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <div>Select a tour to view on map</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}