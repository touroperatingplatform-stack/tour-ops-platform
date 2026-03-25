'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

interface PickupStop {
  id: string
  location_name: string
  address: string
  scheduled_time: string
  guest_count: number
}

interface Tour {
  id: string
  name: string
  start_time: string
  pickup_location: string
}

export default function PickupCheckinPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([])
  const [selectedStopId, setSelectedStopId] = useState<string>('')

  useEffect(() => {
    loadTourData()
    getLocation()
  }, [])

  async function loadTourData() {
    // Load tour
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, pickup_location')
      .eq('id', tourId)
      .single()
    
    if (tourData) setTour(tourData)

    // Load pickup stops
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, address, scheduled_time, guest_count')
      .eq('tour_id', tourId)
      .order('sort_order', { ascending: true })

    if (stopsData) {
      setPickupStops(stopsData)
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
    
    // If scheduled time is earlier in the day, assume it's for today
    if (scheduled < now && (now.getTime() - scheduled.getTime()) > 12 * 60 * 60 * 1000) {
      scheduled.setDate(scheduled.getDate() + 1)
    }
    
    return Math.floor((scheduled.getTime() - now.getTime()) / 60000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!photoUrl) {
      alert('Please take a selfie first')
      return
    }

    if (!location) {
      alert('Waiting for GPS. Please enable location services.')
      return
    }

    if (!selectedStopId) {
      alert('Please select a pickup stop')
      return
    }

    setLoading(true)

    try {
      const selectedStop = pickupStops.find(s => s.id === selectedStopId)
      const minutesEarly = selectedStop ? calculateMinutesEarly(selectedStop.scheduled_time) : 0

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get tour data for brand_id
      const { data: tourData } = await supabase
        .from('tours')
        .select('brand_id')
        .eq('id', tourId)
        .single()

      // Insert into guide_checkins using EXISTING table
      const { error } = await supabase
        .from('guide_checkins')
        .insert({
          tour_id: tourId,
          brand_id: tourData?.brand_id,
          guide_id: user.id,
          pickup_stop_id: selectedStopId,
          checkin_type: 'pre_pickup',
          checked_in_at: new Date().toISOString(),
          latitude: location.lat,
          longitude: location.lng,
          location_accuracy: location.accuracy,
          selfie_url: photoUrl,
          scheduled_time: selectedStop?.scheduled_time,
          minutes_early_or_late: minutesEarly,
          notes: `Checked in at ${selectedStop?.location_name}`
        })

      if (error) throw error

      router.push('/guide')
    } catch (err: any) {
      console.error('Checkin error:', err)
      alert(err.message || 'Failed to check in')
    } finally {
      setLoading(false)
    }
  }

  const selectedStop = pickupStops.find(s => s.id === selectedStopId)
  const minutesEarly = selectedStop ? calculateMinutesEarly(selectedStop.scheduled_time) : 0

  let statusBadge = { label: 'On time', color: 'bg-blue-100 text-blue-700' }
  if (minutesEarly >= 20) statusBadge = { label: `${minutesEarly} min early ✓`, color: 'bg-green-100 text-green-700' }
  else if (minutesEarly > 0) statusBadge = { label: `${minutesEarly} min early`, color: 'bg-blue-100 text-blue-700' }
  else if (minutesEarly >= -10) statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-yellow-100 text-yellow-700' }
  else statusBadge = { label: `${Math.abs(minutesEarly)} min late`, color: 'bg-red-100 text-red-700' }

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/guide/tours/${tourId}`} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Pickup Check-in</h1>
        <p className="text-gray-500 mt-1">Confirm arrival at pickup location</p>
      </div>

      {/* Tour Info */}
      {tour && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-gray-900">{tour.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pickup: {tour.start_time?.slice(0, 5)} | {new Date().toLocaleDateString()}
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${statusBadge.color}`}>
            {statusBadge.label}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {/* Select Pickup Stop */}
        {pickupStops.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Stop *</label>
            <select
              value={selectedStopId}
              onChange={(e) => setSelectedStopId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pickupStops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.location_name} - {stop.scheduled_time?.slice(0, 5)} ({stop.guest_count} guests)
                </option>
              ))}
            </select>
            {selectedStop && (
              <p className="text-sm text-gray-500 mt-1">{selectedStop.address}</p>
            )}
          </div>
        )}

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GPS Location</label>
          {location ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Location captured ✓</span>
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
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Getting location...</span>
            </div>
          )}
        </div>

        {/* Selfie Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Selfie at Pickup *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {photoUrl ? (
              <div className="space-y-2">
                <img src={photoUrl} alt="Check-in selfie" className="max-h-48 mx-auto rounded-lg" />
                <p className="text-sm text-green-600 font-medium">✓ Photo captured</p>
                <button type="button" onClick={() => setPhotoUrl(null)} className="text-sm text-red-600 hover:underline">
                  Retake photo
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-medium">Take selfie at pickup location</p>
                <p className="text-xs text-gray-500 mt-1">Front camera will open</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-blue-600 mt-2">⏳ Uploading...</p>}
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !photoUrl || !location || !selectedStopId}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking in...' : 'Confirm Pickup Check-in'}
        </button>
      </form>
    </div>
  )
}
