'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  acknowledged_at: string | null
  confirmed_office_arrival_time: string | null
  confirmed_pickup_time: string | null
  brand_id: string
  vehicle_id: string | null
  vehicles?: { plate_number: string; model: string }
}

interface Stop {
  id: string
  location_name: string
  scheduled_time: string
  guest_count: number
  stop_type: 'pickup' | 'activity' | 'dropoff'
  sort_order: number
}

interface Reservation {
  id: string
  adult_pax: number
  child_pax: number
  infant_pax: number
  dietary_restrictions: string[]
  accessibility_needs: string[]
  special_requests: string | null
}

interface Profile {
  full_name: string
  phone: string
}

export default function AcknowledgeTourPage() {
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [pickupStops, setPickupStops] = useState<Stop[]>([])
  const [activityStops, setActivityStops] = useState<Stop[]>([])
  const [dropoffStops, setDropoffStops] = useState<Stop[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [supervisor, setSupervisor] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [officeArrivalTime, setOfficeArrivalTime] = useState('')
  const [pickupStartTime, setPickupStartTime] = useState('')
  const [vanConfirmed, setVanConfirmed] = useState(false)

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('*, vehicles(plate_number, model)')
      .eq('id', params.id)
      .single()

    if (tourData) {
      setTour(tourData)
      
      // Set defaults based on tour start time
      const [hours, minutes] = tourData.start_time.split(':').map(Number)
      const pickupDate = new Date()
      pickupDate.setHours(hours, minutes, 0)
      pickupDate.setMinutes(pickupDate.getMinutes() - 20)
      
      const defaultPickup = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      pickupDate.setMinutes(pickupDate.getMinutes() - 30)
      const defaultOffice = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      
      setPickupStartTime(tourData.confirmed_pickup_time || defaultPickup)
      setOfficeArrivalTime(tourData.confirmed_office_arrival_time || defaultOffice)
      
      // Load all stops
      const { data: allStops } = await supabase
        .from('pickup_stops')
        .select('id, location_name, scheduled_time, guest_count, stop_type, sort_order')
        .eq('tour_id', params.id)
        .order('sort_order')
      
      if (allStops) {
        setPickupStops(allStops.filter(s => s.stop_type === 'pickup'))
        setActivityStops(allStops.filter(s => s.stop_type === 'activity'))
        setDropoffStops(allStops.filter(s => s.stop_type === 'dropoff'))
      }

      // Load reservations for special needs
      const { data: resData } = await supabase
        .from('reservation_manifest')
        .select('id, adult_pax, child_pax, infant_pax, dietary_restrictions, accessibility_needs, special_requests')
        .eq('tour_id', params.id)
      
      if (resData) setReservations(resData)

      // Load brand supervisor (first admin)
      const { data: brandAdmins } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('brand_id', tourData.brand_id)
        .eq('role', 'admin')
        .limit(1)
      
      if (brandAdmins && brandAdmins.length > 0) {
        setSupervisor(brandAdmins[0])
      }
    }
    setLoading(false)
  }

  async function handleAcknowledge() {
    if (!officeArrivalTime || !pickupStartTime || !vanConfirmed) {
      alert('Please confirm all items')
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
        <Link href="/guide" className="text-blue-600 hover:underline">← Back</Link>
      </div>
    )
  }

  if (tour.acknowledged_at) {
    router.push(`/guide/tours/${params.id}`)
    return null
  }

  // Calculate totals
  const totalAdults = reservations.reduce((sum, r) => sum + (r.adult_pax || 0), 0)
  const totalChildren = reservations.reduce((sum, r) => sum + (r.child_pax || 0), 0)
  const totalInfants = reservations.reduce((sum, r) => sum + (r.infant_pax || 0), 0)
  const totalGuests = totalAdults + totalChildren + totalInfants

  // Collect special needs
  const dietaryNeeds = reservations.flatMap(r => r.dietary_restrictions || []).filter((v, i, a) => a.indexOf(v) === i)
  const accessibilityNeeds = reservations.flatMap(r => r.accessibility_needs || []).filter((v, i, a) => a.indexOf(v) === i)
  const specialRequests = reservations.filter(r => r.special_requests).map(r => r.special_requests)

  // Time until tour
  const tourDate = new Date(tour.tour_date)
  const now = new Date()
  const diffHours = Math.round((tourDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const timeLabel = diffHours <= 0 ? 'Today' : diffHours <= 24 ? `${diffHours} hours` : `${Math.round(diffHours / 24)} days`

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <Link href="/guide" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Tours
          </Link>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {timeLabel}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{tour.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date(tour.tour_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Guest Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>👥</span> Guest Summary
        </h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-gray-900">{totalGuests}</span>
          <span className="text-gray-500">guests total</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">{totalAdults} Adults</span>
          {totalChildren > 0 && <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">{totalChildren} Children</span>}
          {totalInfants > 0 && <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium">{totalInfants} Infants</span>}
        </div>
      </div>

      {/* Pickup Locations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📍</span> Pickup Locations
        </h3>
        <div className="space-y-3">
          {pickupStops.map((stop, idx) => (
            <div key={stop.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{stop.location_name}</div>
                <div className="text-sm text-gray-500">{stop.guest_count} guests</div>
              </div>
              <div className="text-blue-600 font-semibold">{stop.scheduled_time?.slice(0, 5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activities */}
      {activityStops.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🎯</span> Activities
          </h3>
          <div className="space-y-2">
            {activityStops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="font-medium text-gray-900">{stop.location_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropoff */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🏁</span> Dropoff
        </h3>
        <div className="space-y-2">
          {dropoffStops.map((stop, idx) => (
            <div key={stop.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                {idx + 1}
              </div>
              <div className="font-medium text-gray-900">{stop.location_name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Return to Office */}
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span>🏢</span> Return to Office
        </h3>
        <p className="text-gray-500 text-sm">After completing dropoff</p>
      </div>

      {/* Special Notes */}
      {(dietaryNeeds.length > 0 || accessibilityNeeds.length > 0 || specialRequests.length > 0) && (
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> Special Notes
          </h3>
          <div className="space-y-3">
            {dietaryNeeds.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 flex items-center gap-1 mb-2">🍽️ Dietary Requirements</span>
                <div className="flex flex-wrap gap-2">
                  {dietaryNeeds.map((need, idx) => (
                    <span key={idx} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">{need}</span>
                  ))}
                </div>
              </div>
            )}
            {accessibilityNeeds.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 flex items-center gap-1 mb-2">♿ Accessibility Needs</span>
                <div className="flex flex-wrap gap-2">
                  {accessibilityNeeds.map((need, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{need}</span>
                  ))}
                </div>
              </div>
            )}
            {specialRequests.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 flex items-center gap-1 mb-2">📝 Special Requests</span>
                <div className="space-y-1">
                  {specialRequests.map((req, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-white p-2 rounded-lg">{req}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Check */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>✅</span> Equipment Check
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setVanConfirmed(!vanConfirmed)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              vanConfirmed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🚐</span>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Van Assigned</div>
              <div className="text-sm text-gray-500">
                {tour.vehicles ? `${tour.vehicles.plate_number} • ${tour.vehicles.model}` : 'Confirm with dispatcher'}
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              vanConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'
            }`}>
              {vanConfirmed && <span className="text-white font-bold">✓</span>}
            </div>
          </button>

          {supervisor && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">📞</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Emergency Contact</div>
                <div className="text-sm text-gray-500">{supervisor.full_name}</div>
              </div>
              <a href={`tel:${supervisor.phone}`} className="text-blue-600 font-semibold">{supervisor.phone}</a>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Guide Packet</div>
              <div className="text-sm text-gray-500">Ready to review</div>
            </div>
            <div className="text-green-600 font-bold">✓</div>
          </div>
        </div>
      </div>

      {/* Time Confirmation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⏰</span> Confirm Your Times
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My office arrival time
            </label>
            <input
              type="time"
              value={officeArrivalTime}
              onChange={(e) => setOfficeArrivalTime(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My pickup start time
            </label>
            <input
              type="time"
              value={pickupStartTime}
              onChange={(e) => setPickupStartTime(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Actions - Double height button */}
      <div className="space-y-3 pt-4 pb-6">
        <button
          onClick={handleAcknowledge}
          disabled={submitting || !officeArrivalTime || !pickupStartTime || !vanConfirmed}
          className={`w-full py-6 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-3 ${
            !submitting && officeArrivalTime && pickupStartTime && vanConfirmed
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <span className="animate-spin">⟳</span>
              Confirming...
            </>
          ) : (
            <>
              <span className="text-2xl">✓</span>
              ACCEPT TOUR
            </>
          )}
        </button>
        <button
          onClick={() => router.back()}
          className="w-full py-3 text-gray-500 font-medium text-center hover:text-gray-700"
        >
          Need to Discuss
        </button>
      </div>
    </div>
  )
}
