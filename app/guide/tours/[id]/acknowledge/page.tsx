'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  pickup_location: string
  status: string
  acknowledged_at: string | null
  confirmed_office_arrival_time: string | null
  confirmed_pickup_time: string | null
}

interface PickupStop {
  id: string
  location_name: string
  scheduled_time: string
  guest_count: number
  sort_order: number
}

export default function AcknowledgeTourPage() {
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [officeArrivalTime, setOfficeArrivalTime] = useState('')
  const [pickupStartTime, setPickupStartTime] = useState('')

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, tour_date, start_time, pickup_location, status, acknowledged_at, confirmed_office_arrival_time, confirmed_pickup_time')
      .eq('id', params.id)
      .single()

    if (tourData) {
      setTour(tourData)
      
      // Set defaults based on tour start time (20 min before for pickup)
      const [hours, minutes] = tourData.start_time.split(':').map(Number)
      const pickupDate = new Date()
      pickupDate.setHours(hours, minutes, 0)
      pickupDate.setMinutes(pickupDate.getMinutes() - 20) // 20 min before first pickup
      
      const defaultPickup = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      
      // Office arrival default: 30 min before pickup
      pickupDate.setMinutes(pickupDate.getMinutes() - 30)
      const defaultOffice = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      
      setPickupStartTime(tourData.confirmed_pickup_time || defaultPickup)
      setOfficeArrivalTime(tourData.confirmed_office_arrival_time || defaultOffice)
      
      // Load pickup stops
      const { data: stops } = await supabase
        .from('pickup_stops')
        .select('id, location_name, scheduled_time, guest_count, sort_order')
        .eq('tour_id', params.id)
        .eq('stop_type', 'pickup')
        .order('sort_order')
      
      if (stops) setPickupStops(stops)
    }
    setLoading(false)
  }

  async function handleAcknowledge() {
    if (!officeArrivalTime || !pickupStartTime) {
      alert('Please confirm both times')
      return
    }

    setSubmitting(true)
    
    const { error } = await supabase
      .from('tours')
      .update({
        acknowledged_at: new Date().toISOString(),
        confirmed_office_arrival_time: officeArrivalTime,
        confirmed_pickup_time: pickupStartTime
      })
      .eq('id', params.id)

    if (error) {
      alert('Failed to acknowledge tour')
      setSubmitting(false)
      return
    }

    router.push(`/guide/tours/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tour not found</h1>
      </div>
    )
  }

  // Already acknowledged?
  if (tour.acknowledged_at) {
    router.push(`/guide/tours/${params.id}`)
    return null
  }

  const firstPickup = pickupStops[0]
  const totalGuests = pickupStops.reduce((sum, s) => sum + (s.guest_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Tour Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📢</div>
            <h1 className="text-2xl font-bold text-gray-900">New Tour Assigned</h1>
            <p className="text-gray-500 mt-1">Please confirm your availability</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-lg text-gray-900">{tour.name}</h2>
            <p className="text-gray-600 mt-1">
              {new Date(tour.tour_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-blue-600 font-medium mt-2">
              Start time: {tour.start_time?.slice(0, 5)}
            </p>
          </div>

          {/* Pickup Summary */}
          {firstPickup && (
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-sm text-gray-500 mb-2">First pickup location:</p>
              <p className="font-medium">{firstPickup.location_name}</p>
              <p className="text-sm text-gray-500 mt-2">
                {pickupStops.length} stop{pickupStops.length !== 1 ? 's' : ''} • {totalGuests} guests
              </p>
            </div>
          )}
        </div>

        {/* Time Confirmation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Confirm Your Times</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What time will you arrive at the office?
              </label>
              <input
                type="time"
                value={officeArrivalTime}
                onChange={(e) => setOfficeArrivalTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: at least 30 minutes before first pickup
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What time will you start pickups?
              </label>
              <input
                type="time"
                value={pickupStartTime}
                onChange={(e) => setPickupStartTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {firstPickup && (
                <p className="text-xs text-gray-500 mt-1">
                  First scheduled pickup: {firstPickup.scheduled_time?.slice(0, 5)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAcknowledge}
            disabled={submitting || !officeArrivalTime || !pickupStartTime}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Confirming...' : 'Confirm & Acknowledge'}
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-white text-gray-700 px-6 py-3 rounded-xl border border-gray-300 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}