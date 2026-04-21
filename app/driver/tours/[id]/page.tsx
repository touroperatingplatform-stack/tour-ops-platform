'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  pickup_location: string
  acknowledged_at: string | null
  tour_date: string
  vehicle_id: string | null
  vehicles?: { plate_number: string; model: string }
}

interface Stop {
  id: string
  location_name: string
  address: string
  scheduled_time: string
  guest_count: number
  stop_type: 'pickup' | 'activity' | 'dropoff'
  sort_order: number
}

interface Checkin {
  id: string
  pickup_stop_id: string
  checkin_type: string
  checked_in_at: string
}

function DriverTourContent() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [stops, setStops] = useState<Stop[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    loadTour()
  }, [])

  useEffect(() => {
    if (tour && tour.status === 'scheduled' && !tour.acknowledged_at && !shouldRedirect) {
      setShouldRedirect(true)
      router.push(`/driver/tours/${params.id}/acknowledge`)
    }
  }, [tour, shouldRedirect, router, params.id])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('*, vehicles(plate_number, model)')
      .eq('id', params.id)
      .single()

    if (tourData) {
      setTour(tourData)
    }
    setLoading(false)
  }

  async function loadStops() {
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, address, scheduled_time, guest_count, stop_type, sort_order')
      .eq('tour_id', params.id)
      .order('sort_order', { ascending: true })
    
    if (stopsData) setStops(stopsData)

    const { data: checkinsData } = await supabase
      .from('guide_checkins')
      .select('id, pickup_stop_id, checkin_type, checked_in_at')
      .eq('tour_id', params.id)
    
    if (checkinsData) setCheckins(checkinsData)
  }

  async function handleCheckIn(stopId: string, stopType: string) {
    setCheckingIn(stopId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (e) {
          console.log('GPS not available')
        }
      }

      await supabase.from('guide_checkins').insert({
        tour_id: params.id,
        pickup_stop_id: stopId,
        checkin_type: stopType,
        checked_in_at: new Date().toISOString(),
        location_lat: location?.lat,
        location_lng: location?.lng
      })

      loadStops()
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in. Please try again.')
    } finally {
      setCheckingIn(null)
    }
  }

  // Redirect to acknowledgment if not acknowledged
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tour...</div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tour not found</h1>
        <Link href="/driver" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  if (tour.status === 'scheduled' && !tour.acknowledged_at) {
    router.push(`/driver/tours/${params.id}/acknowledge`)
    return null
  }

  // Phase management
  const pickupStops = stops.filter(s => s.stop_type === 'pickup')
  const activityStops = stops.filter(s => s.stop_type === 'activity')
  const dropoffStops = stops.filter(s => s.stop_type === 'dropoff')
  
  // Check if all pickups are done
  const completedPickups = pickupStops.filter(stop => 
    checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === 'pickup')
  )
  const allPickupsDone = pickupStops.length > 0 && completedPickups.length === pickupStops.length
  
  // Check if all activities are done
  const completedActivities = activityStops.filter(stop => 
    checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === 'activity')
  )
  const allActivitiesDone = activityStops.length > 0 && completedActivities.length === activityStops.length
  
  // Check if all dropoffs are done
  const completedDropoffs = dropoffStops.filter(stop => 
    checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === 'dropoff')
  )
  const allDropoffsDone = dropoffStops.length > 0 && completedDropoffs.length === dropoffStops.length
  
  // Determine current phase
  let currentPhase: 'pickups' | 'activities' | 'dropoffs' = 'pickups'
  if (allPickupsDone && !allActivitiesDone) currentPhase = 'activities'
  else if (allPickupsDone && allActivitiesDone) currentPhase = 'dropoffs'

  // Check if a stop is checked in
  const isCheckedIn = (stopId: string, stopType: string) => {
    return checkins.some(c => c.pickup_stop_id === stopId && c.checkin_type === stopType)
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Link href="/driver" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <span className="text-sm text-gray-500">Tour Details</span>
      </div>

      {/* Tour Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-2">{tour.name}</h1>
        <p className="text-gray-500 mb-4">{tour.vehicles?.plate_number || 'Unknown Vehicle'}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium">{tour.tour_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Time:</span>
            <span className="font-medium">{tour.start_time?.slice(0, 5)}</span>
          </div>
        </div>
      </div>

      {/* Scheduled Phase - Pre-Trip Check-in */}
      {tour.status === 'scheduled' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">Pre-Trip Check-in</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Complete vehicle inspection before starting the tour
          </p>
          <Link
            href={`/driver/tours/${params.id}/checkin`}
            className="block w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg text-center hover:bg-blue-700"
          >
            Start Vehicle Check-in
          </Link>
        </div>
      )}

      {/* In Progress - Show Tour Stops */}
      {tour.status === 'in_progress' && (
        <>
          {/* Phase Indicator */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tour Progress</h2>
            <div className="flex items-center gap-2">
              {/* Phase 1: Pickups */}
              <div className={`flex-1 p-3 rounded-xl border-2 ${
                currentPhase === 'pickups' ? 'bg-blue-50 border-blue-200' : 
                allPickupsDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{allPickupsDone ? '✅' : '📍'}</span>
                  <span className={`font-medium ${currentPhase === 'pickups' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Pickups
                  </span>
                </div>
                {pickupStops.length > 0 && (
                  <div className="text-xs mt-1 text-gray-500">
                    {completedPickups.length}/{pickupStops.length} done
                  </div>
                )}
              </div>

              {/* Connector */}
              <div className={`w-4 h-1 ${allPickupsDone ? 'bg-green-500' : 'bg-gray-300'}`} />

              {/* Phase 2: Activities */}
              <div className={`flex-1 p-3 rounded-xl border-2 ${
                currentPhase === 'activities' ? 'bg-blue-50 border-blue-200' : 
                allActivitiesDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{allActivitiesDone ? '✅' : '🎯'}</span>
                  <span className={`font-medium ${currentPhase === 'activities' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Activities
                  </span>
                </div>
                {activityStops.length > 0 && (
                  <div className="text-xs mt-1 text-gray-500">
                    {completedActivities.length}/{activityStops.length} done
                  </div>
                )}
              </div>

              {/* Connector */}
              <div className={`w-4 h-1 ${allActivitiesDone ? 'bg-green-500' : 'bg-gray-300'}`} />

              {/* Phase 3: Dropoffs */}
              <div className={`flex-1 p-3 rounded-xl border-2 ${
                currentPhase === 'dropoffs' ? 'bg-blue-50 border-blue-200' : 
                allDropoffsDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{allDropoffsDone ? '✅' : '🏁'}</span>
                  <span className={`font-medium ${currentPhase === 'dropoffs' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Dropoffs
                  </span>
                </div>
                {dropoffStops.length > 0 && (
                  <div className="text-xs mt-1 text-gray-500">
                    {completedDropoffs.length}/{dropoffStops.length} done
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Phase Stops */}
          {currentPhase === 'pickups' && pickupStops.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📍</span>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">Pickup Locations</h2>
              </div>
              <div className="space-y-3">
                {pickupStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                      isCheckedIn(stop.id, 'pickup')
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">Stop {idx + 1}</span>
                        {isCheckedIn(stop.id, 'pickup') && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{stop.location_name}</div>
                      <div className="text-sm text-gray-500">
                        {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                      </div>
                    </div>
                    {!isCheckedIn(stop.id, 'pickup') && (
                      <button
                        onClick={() => handleCheckIn(stop.id, 'pickup')}
                        disabled={checkingIn === stop.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {checkingIn === stop.id ? 'Checking In...' : 'Check In'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPhase === 'activities' && activityStops.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">🎯</span>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">Activities</h2>
              </div>
              <div className="space-y-3">
                {activityStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                      isCheckedIn(stop.id, 'activity')
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">Activity {idx + 1}</span>
                        {isCheckedIn(stop.id, 'activity') && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{stop.location_name}</div>
                      <div className="text-sm text-gray-500">
                        {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                      </div>
                    </div>
                    {!isCheckedIn(stop.id, 'activity') && (
                      <button
                        onClick={() => handleCheckIn(stop.id, 'activity')}
                        disabled={checkingIn === stop.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {checkingIn === stop.id ? 'Checking In...' : 'Check In'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPhase === 'dropoffs' && dropoffStops.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">🏁</span>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">Drop-off Locations</h2>
              </div>
              <div className="space-y-3">
                {dropoffStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                      isCheckedIn(stop.id, 'dropoff')
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">Drop-off {idx + 1}</span>
                        {isCheckedIn(stop.id, 'dropoff') && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{stop.location_name}</div>
                      <div className="text-sm text-gray-500">
                        {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                      </div>
                    </div>
                    {!isCheckedIn(stop.id, 'dropoff') && (
                      <button
                        onClick={() => handleCheckIn(stop.id, 'dropoff')}
                        disabled={checkingIn === stop.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {checkingIn === stop.id ? 'Checking In...' : 'Check In'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Tour Button */}
          {allDropoffsDone && (
            <Link
              href={`/driver/tours/${params.id}/complete`}
              className="block w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg text-center hover:bg-green-700"
            >
              ✓ Complete Tour
            </Link>
          )}
        </>
      )}

      {/* Completed */}
      {tour.status === 'completed' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Tour Completed</h2>
          <p className="text-gray-500 mb-6">Great job! This tour has been completed.</p>
          <Link
            href="/driver"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

export default function DriverTourPage() {
  return (
    <DriverNav>
      <DriverTourContent />
    </DriverNav>
  )
}
