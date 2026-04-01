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
  start_time: string
  status: string
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
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadTourData()
    getLocation()
  }, [])

  async function loadTourData() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, status')
      .eq('id', tourId)
      .single()
    
    if (tourData) setTour(tourData)

    // Load stops filtered by type
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, address, scheduled_time, guest_count, stop_type, sort_order')
      .eq('tour_id', tourId)
      .eq('stop_type', stopType)
      .order('sort_order', { ascending: true })

    if (stopsData) {
      setStops(stopsData)
      if (stopsData.length > 0) {
        setSelectedStopId(stopsData[0].id)
      }
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
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
        console.error('Location error:', error)
        setLocationError('Could not get GPS. Please enable location services.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'tour-ops/checkins')
      if (url) {
        setPhotoUrl(url)
      }
    } catch (error) {
      console.error('Upload error:', error)
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

      // Redirect based on next step
      if (stopType === 'pickup') {
        // After pickup, check if there are more pickups or go to activity
        const remainingPickups = stops.filter(s => s.id !== selectedStopId && s.stop_type === 'pickup')
        if (remainingPickups.length > 0) {
          router.push(`/guide/tours/${tourId}/checkin?type=pickup`)
        } else {
          router.push(`/guide/tours/${tourId}`)
        }
      } else {
        router.push(`/guide/tours/${tourId}`)
      }
    } catch (err: any) {
      console.error('Checkin error:', err)
      alert(err.message || 'Failed to check in')
    } finally {
      setLoading(false)
    }
  }

  const selectedStop = stops.find(s => s.id === selectedStopId)
  const minutesEarly = selectedStop ? calculateMinutesEarly(selectedStop.scheduled_time) : 0

  let statusBadge = { label: 'On time', color: 'bg-blue-100 text-blue-700' }
  if (minutesEarly >= 20) statusBadge = { label: `${minutesEarly} min early ✓`, color: 'bg-green-100 text-green-700' }
  else if (minutesEarly > 0) statusBadge = { label: `${minutesEarly} min early`, color: 'bg-blue-100 text-blue-700' }
  else if (minutesEarly >= -10) statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-yellow-100 text-yellow-700' }
  else statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-red-100 text-red-700' }

  const typeLabels: Record<StopType, string> = {
    pickup: 'Pickup',
    activity: 'Activity',
    dropoff: 'Dropoff'
  }

  const typeIcons: Record<StopType, string> = {
    pickup: '📍',
    activity: '🎯',
    dropoff: '🏁'
  }

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/guide/tours/${tourId}`} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
          <span>←</span>
          Back to Tour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {typeIcons[stopType]} {typeLabels[stopType]} Check-in
        </h1>
        <p className="text-gray-500 mt-1">Confirm arrival at {typeLabels[stopType].toLowerCase()} location</p>
      </div>

      {/* Tour Info */}
      {tour && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-gray-900">{tour.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          {selectedStop && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${statusBadge.color}`}>
              {statusBadge.label}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Stop */}
        {stops.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Stop</label>
            <select
              value={selectedStopId}
              onChange={(e) => setSelectedStopId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.sort_order}. {stop.location_name} - {stop.scheduled_time?.slice(0, 5)}
                  {stop.guest_count && ` (${stop.guest_count} guests)`}
                </option>
              ))}
            </select>
            {selectedStop?.address && (
              <p className="text-sm text-gray-500 mt-2">{selectedStop.address}</p>
            )}
          </div>
        )}

        {/* GPS Location */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">GPS Location</label>
          {location ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              <span>✓</span>
              <span className="text-sm font-medium">Location captured</span>
              {location.accuracy && (
                <span className="text-xs ml-auto">±{Math.round(location.accuracy)}m</span>
              )}
            </div>
          ) : locationError ? (
            <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              {locationError}
              <button type="button" onClick={getLocation} className="text-red-700 underline ml-2">Retry</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-lg">
              <span className="animate-pulse">⏳</span>
              <span className="text-sm font-medium">Getting location...</span>
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo Proof *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {photoUrl ? (
              <div className="space-y-2">
                <img src={photoUrl} alt="Check-in photo" className="max-h-48 mx-auto rounded-lg" />
                <p className="text-sm text-green-600 font-medium">✓ Photo captured</p>
                <button type="button" onClick={() => setPhotoUrl(null)} className="text-sm text-red-600 hover:underline">
                  Retake photo
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Take photo at location</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
              </label>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this stop..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !photoUrl || !location || !selectedStopId}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking in...' : `Confirm ${typeLabels[stopType]} Check-in`}
        </button>
      </form>
    </div>
  )
}