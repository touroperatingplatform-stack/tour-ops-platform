'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

type StopType = 'pickup' | 'activity' | 'dropoff'

interface PickupStop {
  id: string
  location_name: string
  address: string
  scheduled_time: string
  guest_count: number
  stop_type: StopType
  sort_order: number
}

interface Tour {
  id: string
  name: string
  status: string
  acknowledged_at: string | null
}

interface Reservation {
  id: string
  primary_contact_name: string
  adult_pax: number
  child_pax: number
  infant_pax: number
  checked_in: boolean
  no_show: boolean
}

export default function PickupCheckinPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tourId = params.id as string
  const stopType = (searchParams.get('type') as StopType) || 'pickup'

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [stops, setStops] = useState<PickupStop[]>([])
  const [selectedStopId, setSelectedStopId] = useState<string>('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [notes, setNotes] = useState('')
  const [checkedGuests, setCheckedGuests] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTourData()
    getLocation()
  }, [])

  async function loadTourData() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, status, acknowledged_at')
      .eq('id', tourId)
      .single()
    
    if (tourData) {
      setTour(tourData)
      
      if (!tourData.acknowledged_at) {
        router.push(`/guide/tours/${tourId}/acknowledge`)
        return
      }
      
      if (tourData.status === 'scheduled') {
        router.push(`/guide/tours/${tourId}`)
        return
      }

      const { data: stopsData } = await supabase
        .from('pickup_stops')
        .select('id, location_name, address, scheduled_time, guest_count, stop_type, sort_order')
        .eq('tour_id', tourId)
        .eq('stop_type', stopType)
        .order('sort_order', { ascending: true })

      if (stopsData && stopsData.length > 0) {
        setStops(stopsData)
        setSelectedStopId(stopsData[0].id)
      }

      // Load reservations for this tour
      const { data: resData } = await supabase
        .from('reservation_manifest')
        .select('id, primary_contact_name, adult_pax, child_pax, infant_pax, checked_in, no_show')
        .eq('tour_id', tourId)
      
      if (resData) {
        setReservations(resData)
        // Pre-check already checked in guests
        const checked = new Set(resData.filter(r => r.checked_in).map(r => r.id))
        setCheckedGuests(checked)
      }
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        setLocationError('Could not get GPS')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'tour-ops/checkins')
      if (url) setPhotoUrl(url as string)
    } catch (error) {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  function calculateMinutesEarly(scheduledTime: string) {
    const now = new Date()
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    const scheduled = new Date()
    scheduled.setHours(hours, minutes, 0, 0)
    
    if (scheduled < now && (now.getTime() - scheduled.getTime()) > 12 * 60 * 60 * 1000) {
      scheduled.setDate(scheduled.getDate() + 1)
    }
    
    return Math.floor((scheduled.getTime() - now.getTime()) / 60000)
  }

  function toggleGuest(guestId: string) {
    const newChecked = new Set(checkedGuests)
    if (newChecked.has(guestId)) {
      newChecked.delete(guestId)
    } else {
      newChecked.add(guestId)
    }
    setCheckedGuests(newChecked)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!photoUrl) {
      alert('Please take a photo first')
      return
    }

    if (!location) {
      alert('Waiting for GPS. Please enable location services.')
      return
    }

    if (!selectedStopId) {
      alert('Please select a stop')
      return
    }

    setLoading(true)

    try {
      const selectedStop = stops.find(s => s.id === selectedStopId)
      const minutesEarly = selectedStop ? calculateMinutesEarly(selectedStop.scheduled_time) : 0

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: tourData } = await supabase
        .from('tours')
        .select('brand_id')
        .eq('id', tourId)
        .single()

      // Insert checkin
      const { error } = await supabase
        .from('guide_checkins')
        .insert({
          tour_id: tourId,
          brand_id: tourData?.brand_id,
          guide_id: user.id,
          pickup_stop_id: selectedStopId,
          checkin_type: stopType,
          checked_in_at: new Date().toISOString(),
          latitude: location.lat,
          longitude: location.lng,
          location_accuracy: location.accuracy,
          selfie_url: photoUrl,
          scheduled_time: selectedStop?.scheduled_time,
          minutes_early_or_late: minutesEarly,
          notes: notes || null
        })

      if (error) throw error

      // Update reservation check-ins for pickup type
      if (stopType === 'pickup') {
        for (const guestId of checkedGuests) {
          await supabase
            .from('reservation_manifest')
            .update({ checked_in: true, checked_in_at: new Date().toISOString() })
            .eq('id', guestId)
        }
      }

      // Redirect
      if (stopType === 'pickup') {
        const remainingPickups = stops.filter(s => s.id !== selectedStopId)
        if (remainingPickups.length > 0) {
          router.push(`/guide/tours/${tourId}/checkin?type=pickup`)
        } else {
          // Check if there are activities next
          const { data: activities } = await supabase
            .from('pickup_stops')
            .select('id')
            .eq('tour_id', tourId)
            .eq('stop_type', 'activity')
          
          if (activities && activities.length > 0) {
            router.push(`/guide/tours/${tourId}/checkin?type=activity`)
          } else {
            router.push(`/guide/tours/${tourId}`)
          }
        }
      } else if (stopType === 'activity') {
        const remainingActivities = stops.filter(s => s.id !== selectedStopId)
        if (remainingActivities.length > 0) {
          router.push(`/guide/tours/${tourId}/checkin?type=activity`)
        } else {
          // Check if there are dropoffs
          const { data: dropoffs } = await supabase
            .from('pickup_stops')
            .select('id')
            .eq('tour_id', tourId)
            .eq('stop_type', 'dropoff')
          
          if (dropoffs && dropoffs.length > 0) {
            router.push(`/guide/tours/${tourId}/checkin?type=dropoff`)
          } else {
            router.push(`/guide/tours/${tourId}`)
          }
        }
      } else {
        router.push(`/guide/tours/${tourId}`)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to check in')
    } finally {
      setLoading(false)
    }
  }

  const selectedStop = stops.find(s => s.id === selectedStopId)
  const minutesEarly = selectedStop ? calculateMinutesEarly(selectedStop.scheduled_time) : 0

  let statusBadge = { label: 'On time', color: 'bg-blue-100 text-blue-700', icon: '⏰' }
  if (minutesEarly >= 20) statusBadge = { label: `${minutesEarly} min early`, color: 'bg-green-100 text-green-700', icon: '✓' }
  else if (minutesEarly > 0) statusBadge = { label: `${minutesEarly} min early`, color: 'bg-green-50 text-green-700', icon: '✓' }
  else if (minutesEarly >= -10) statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' }
  else statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-red-100 text-red-700', icon: '⚠️' }

  const typeLabels: Record<StopType, string> = {
    pickup: 'Pickup',
    activity: 'Activity',
    dropoff: 'Dropoff'
  }

  const typeColors: Record<StopType, string> = {
    pickup: 'bg-blue-600',
    activity: 'bg-orange-600',
    dropoff: 'bg-green-600'
  }

  const typeBgColors: Record<StopType, string> = {
    pickup: 'bg-blue-50 border-blue-200',
    activity: 'bg-orange-50 border-orange-200',
    dropoff: 'bg-green-50 border-green-200'
  }

  const checkedCount = checkedGuests.size
  const totalCount = reservations.length

  return (
    <div className="pb-32">
      {/* Header */}
      <div className={`${typeColors[stopType]} text-white p-6 rounded-b-3xl`}>
        <div className="flex items-center justify-between mb-4">
          <Link href={`/guide/tours/${tourId}`} className="text-white/80 hover:text-white">
            ← Back
          </Link>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {stopType}
          </span>
        </div>
        <h1 className="text-2xl font-bold">
          {typeLabels[stopType]} Check-in
        </h1>
        {tour && <p className="text-white/80 mt-1">{tour.name}</p>}
      </div>

      <div className="p-4 space-y-6">
        {/* Selected Stop */}
        {stops.length > 0 && selectedStop && (
          <div className={`rounded-2xl border-2 p-6 ${typeBgColors[stopType]}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${typeColors[stopType]} flex items-center justify-center text-white text-xl`}>
                  {stopType === 'pickup' ? '📍' : stopType === 'activity' ? '🎯' : '🏁'}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedStop.location_name}</div>
                  <div className="text-sm opacity-70">{selectedStop.guest_count} guests</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                {statusBadge.label}
              </div>
            </div>

            {/* Stop selector */}
            {stops.length > 1 && (
              <select
                value={selectedStopId}
                onChange={(e) => setSelectedStopId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              >
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.sort_order}. {stop.location_name} - {stop.scheduled_time?.slice(0, 5)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* GPS Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              location ? 'bg-green-100 text-green-600' : locationError ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {location ? '✓' : locationError ? '✗' : '⏳'}
            </div>
            <div className="flex-1">
              <div className="font-medium">GPS Location</div>
              <div className="text-sm text-gray-500">
                {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} (±${Math.round(location.accuracy || 0)}m)` : locationError || 'Getting location...'}
              </div>
            </div>
            {locationError && (
              <button onClick={getLocation} className="text-blue-600 text-sm font-medium">
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">📷 Photo Proof</h3>
          {photoUrl ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={photoUrl} alt="Check-in" className="w-full h-48 object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
              >
                ⟳
              </button>
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                ✓ Captured
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <span className="text-3xl">📷</span>
              </div>
              <span className="text-gray-600 font-medium">Tap to capture photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Guest Check-in (Pickup only) */}
        {stopType === 'pickup' && reservations.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">👥 Check-in Guests</h3>
              <span className="text-sm text-gray-500">{checkedCount}/{totalCount}</span>
            </div>
            <div className="space-y-2">
              {reservations.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => !guest.no_show && toggleGuest(guest.id)}
                  disabled={guest.no_show}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    guest.no_show
                      ? 'bg-red-50 border-red-200 opacity-50'
                      : checkedGuests.has(guest.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    guest.no_show
                      ? 'bg-red-200 text-red-700'
                      : checkedGuests.has(guest.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {guest.no_show ? '✗' : checkedGuests.has(guest.id) ? '✓' : '○'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${guest.no_show ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {guest.primary_contact_name || 'Guest'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {guest.adult_pax}A {guest.child_pax > 0 ? `${guest.child_pax}C` : ''} {guest.infant_pax > 0 ? `${guest.infant_pax}I` : ''}
                    </div>
                  </div>
                  {guest.no_show && <span className="text-red-600 text-sm font-medium">No Show</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">📝 Notes (optional)</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this stop..."
            rows={2}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={loading || !photoUrl || !location}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
            !loading && photoUrl && location
              ? `${typeColors[stopType]} text-white shadow-lg`
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              Checking in...
            </>
          ) : (
            <>
              <span>✓</span>
              Confirm {typeLabels[stopType]}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
