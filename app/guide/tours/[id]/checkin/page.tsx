'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

interface Reservation {
  id: string
  primary_contact_name: string
  adult_pax: number
  child_pax: number
  infant_pax: number
  hotel_name: string
  pickup_time: string
  checked_in: boolean
  no_show: boolean
}

interface Tour {
  id: string
  name: string
  status: string
  acknowledged_at: string | null
}

export default function PickupCheckinPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  // Step management
  const [step, setStep] = useState<'select' | 'checkin'>('select')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // Data
  const [tour, setTour] = useState<Tour | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // Check-in flow state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'checkin' | 'noshow' | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // Get tour
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, status, acknowledged_at')
      .eq('id', tourId)
      .single()
    
    if (!tourData) {
      setLoading(false)
      return
    }
    
    setTour(tourData)

    // Redirect guards
    if (!tourData.acknowledged_at) {
      router.push(`/guide/tours/${tourId}/acknowledge`)
      return
    }
    
    if (tourData.status === 'scheduled') {
      router.push(`/guide/tours/${tourId}`)
      return
    }

    // Load pending reservations (not checked_in, not no_show)
    const { data: resData } = await supabase
      .from('reservation_manifest')
      .select('id, primary_contact_name, adult_pax, child_pax, infant_pax, hotel_name, pickup_time, checked_in, no_show')
      .eq('tour_id', tourId)
      .eq('checked_in', false)
      .eq('no_show', false)
      .order('pickup_time', { ascending: true })
    
    if (resData) {
      setReservations(resData)
    }
    
    setLoading(false)
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device')
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
        setLocationError('Could not get GPS location. Please enable location services.')
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

  function selectReservation(res: Reservation) {
    setSelectedReservation(res)
    setStep('checkin')
    getLocation() // Capture GPS when arriving at pickup
  }

  async function handleSubmit() {
    if (!selectedReservation) return
    if (!photoUrl) {
      alert('Please take a photo first')
      return
    }
    if (!location) {
      alert('Waiting for GPS. Please enable location services.')
      return
    }
    if (!actionType) {
      alert('Please select Check In or No Show')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: tourData } = await supabase
        .from('tours')
        .select('brand_id')
        .eq('id', tourId)
        .single()

      // Update reservation status
      await supabase
        .from('reservation_manifest')
        .update({
          checked_in: actionType === 'checkin',
          no_show: actionType === 'noshow',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', selectedReservation.id)

      // Create guide checkin record
      await supabase.from('guide_checkins').insert({
        tour_id: tourId,
        brand_id: tourData?.brand_id,
        guide_id: user.id,
        checkin_type: actionType === 'checkin' ? 'pickup' : 'no_show',
        checked_in_at: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
        location_accuracy: location.accuracy,
        selfie_url: photoUrl,
        notes: notes
      })

      // Back to dashboard
      router.push('/guide')
      
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to save check-in')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Step 1: Select Reservation
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/guide" className="text-sm text-gray-500 mb-2 block">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Select Pickup</h1>
            <p className="text-sm text-gray-500">Choose a reservation to check in</p>
          </div>

          {/* Pending Reservations List */}
          {reservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <span className="text-4xl block mb-3">✓</span>
              <p className="text-gray-900 font-medium">All pickups complete!</p>
              <p className="text-sm text-gray-500 mt-1">No pending reservations</p>
              <Link 
                href="/guide"
                className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => (
                <button
                  key={res.id}
                  onClick={() => selectReservation(res)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{res.hotel_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{res.primary_contact_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {res.adult_pax}A {res.child_pax > 0 ? `${res.child_pax}C` : ''} {res.infant_pax > 0 ? `${res.infant_pax}I` : ''} • {res.pickup_time?.slice(0, 5)}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 2: Check-in Flow
  if (!selectedReservation) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => setStep('select')} 
            className="text-sm text-gray-500 mb-2 block"
          >
            ← Back to List
          </button>
          <h1 className="text-xl font-bold text-gray-900">Pickup Check-in</h1>
          <p className="text-sm text-gray-500">{selectedReservation.hotel_name}</p>
        </div>

        {/* Reservation Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <p className="font-semibold text-gray-900">{selectedReservation.primary_contact_name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {selectedReservation.adult_pax} adults {selectedReservation.child_pax > 0 ? `• ${selectedReservation.child_pax} children` : ''} {selectedReservation.infant_pax > 0 ? `• ${selectedReservation.infant_pax} infants` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-2">Pickup time: {selectedReservation.pickup_time?.slice(0, 5)}</p>
        </div>

        {/* GPS Status */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📍 GPS Location</p>
          {location ? (
            <p className="text-sm text-green-600">
              ✓ Captured ({location.accuracy ? `±${Math.round(location.accuracy)}m` : 'OK'})
            </p>
          ) : locationError ? (
            <div>
              <p className="text-sm text-red-600">{locationError}</p>
              <button 
                onClick={getLocation}
                className="mt-2 text-sm text-blue-600 underline"
              >
                Retry GPS
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Capturing...</p>
          )}
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">📷 Photo Proof</p>
          
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Pickup" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs"
              >
                Retake
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                className="hidden"
                id="photo-input"
              />
              <label 
                htmlFor="photo-input"
                className="cursor-pointer block"
              >
                <span className="text-4xl block mb-2">📷</span>
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Tap to take photo'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Action Selection */}
        {photoUrl && location && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Select action:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActionType('checkin')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  actionType === 'checkin' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <span className="text-2xl block mb-2">✓</span>
                <span className="font-medium text-gray-900">Check In</span>
                <span className="text-xs text-gray-500 block">Guests present</span>
              </button>
              
              <button
                onClick={() => setActionType('noshow')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  actionType === 'noshow' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <span className="text-2xl block mb-2">✗</span>
                <span className="font-medium text-gray-900">No Show</span>
                <span className="text-xs text-gray-500 block">Guests not found</span>
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {actionType && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'noshow' ? 'Describe attempts to find guests...' : 'Any special notes...'}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px]"
            />
          </div>
        )}

        {/* Submit Button */}
        {actionType && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-semibold text-white ${
              actionType === 'checkin' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {submitting ? 'Saving...' : actionType === 'checkin' ? 'Confirm Check In' : 'Mark No Show'}
          </button>
        )}
      </div>
    </div>
  )
}
