'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { compressImage } from '@/lib/image-compression'

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
  pickup_stop_id: string | null
}

interface Tour {
  id: string
  name: string
  status: string
  acknowledged_at: string | null
}

interface PickupStop {
  id: string
  location_name: string
  scheduled_time: string
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
  const [stops, setStops] = useState<PickupStop[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

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
    
    // Refresh data when window regains focus (guide returns from check-in flow)
    const handleFocus = () => {
      if (step === 'select') {
        loadData()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [step])

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

    // Load pickup stops for this tour
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, scheduled_time')
      .eq('tour_id', tourId)
      .eq('stop_type', 'pickup')
      .order('sort_order', { ascending: true })
    
    if (stopsData) {
      setStops(stopsData)
    }

    // Load reservations - filter pending (not checked_in AND not no_show)
    const { data: resData } = await supabase
      .from('reservation_manifest')
      .select('id, primary_contact_name, adult_pax, child_pax, infant_pax, hotel_name, pickup_location, pickup_time, checked_in, no_show, pickup_stop_id')
      .eq('tour_id', tourId)
    
    if (resData) {
      // Log ALL reservations for debugging
      console.log('=== ALL RESERVATIONS ===')
      resData.forEach(r => {
        console.log(`  ${r.id}: ${r.primary_contact_name} at ${r.hotel_name} | checked_in: ${r.checked_in} (${typeof r.checked_in}) | no_show: ${r.no_show} (${typeof r.no_show})`)
      })
      
      // Filter pending (both checked_in and no_show must be explicitly false/null)
      const pending = resData.filter(r => r.checked_in !== true && r.no_show !== true)
      console.log('=== PENDING RESERVATIONS ===', pending.length)
      pending.forEach(r => {
        console.log(`  ${r.id}: ${r.primary_contact_name} at ${r.hotel_name}`)
      })
      
      setReservations(pending)
      setPendingCount(pending.length)
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
      // Compress image before upload (max 1024px, 70% quality, max 1MB)
      const compressedFile = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
        maxFileSizeMB: 1
      })
      
      console.log('Photo compressed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      })
      
      const url = await uploadToCloudinary(compressedFile, 'tour-ops/checkins')
      if (url) setPhotoUrl(url as string)
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('Failed to upload photo. Please try again.')
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

      // Update reservation status - explicit boolean values
      const { error: updateError } = await supabase
        .from('reservation_manifest')
        .update({
          checked_in: actionType === 'checkin',
          no_show: actionType === 'noshow',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', selectedReservation.id)

      if (updateError) {
        console.error('Reservation update error:', updateError)
        throw new Error('Failed to update reservation: ' + (updateError.message || JSON.stringify(updateError)))
      }

      // Create guide checkin record
      // Note: 'no_show' is not a valid checkin_type, use 'pickup' with NO_SHOW prefix in notes
      const checkinData = {
        tour_id: tourId,
        brand_id: tourData?.brand_id,
        guide_id: user.id,
        pickup_stop_id: selectedReservation.pickup_stop_id,
        checkin_type: 'pickup', // Always 'pickup' - no_show indicated in notes
        checked_in_at: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
        location_accuracy: location.accuracy,
        selfie_url: photoUrl,
        notes: actionType === 'noshow' ? `[NO_SHOW] ${notes || 'Guest did not show'}` : notes
      }
      console.log('Inserting checkin with data:', checkinData)
      
      const { error: checkinError } = await supabase.from('guide_checkins').insert(checkinData)

      if (checkinError) {
        console.error('Checkin insert error:', checkinError)
        throw new Error('Failed to save checkin: ' + (checkinError.message || JSON.stringify(checkinError)))
      }

      console.log('Check-in saved successfully')

      // If checked in (not no-show), create dropoff stop for this guest
      if (actionType === 'checkin') {
        // Get tour info for brand_id and to calculate dropoff time
        const { data: tourInfo } = await supabase
          .from('tours')
          .select('brand_id, tour_date')
          .eq('id', tourId)
          .single()
        
        if (tourInfo) {
          // Get the highest sort_order to place dropoff after activities
          const { data: lastStop } = await supabase
            .from('pickup_stops')
            .select('sort_order')
            .eq('tour_id', tourId)
            .order('sort_order', { ascending: false })
            .limit(1)
            .single()
          
          const newSortOrder = (lastStop?.sort_order || 0) + 1
          
          // Create dropoff stop
          const { error: dropoffError } = await supabase
            .from('pickup_stops')
            .insert({
              tour_id: tourId,
              brand_id: tourInfo.brand_id,
              location_name: selectedReservation.hotel_name || 'Hotel',
              scheduled_time: '17:00:00', // Default dropoff time - adjust as needed
              guest_count: selectedReservation.adult_pax + selectedReservation.child_pax + selectedReservation.infant_pax,
              stop_type: 'dropoff',
              sort_order: newSortOrder
            })
          
          if (dropoffError) {
            console.error('Dropoff creation error:', dropoffError)
            // Don't fail the check-in if dropoff creation fails
          } else {
            console.log('Dropoff stop created for guest:', selectedReservation.primary_contact_name)
          }
        }
      }

      // Back to dashboard
      router.push('/guide')
      
    } catch (error: any) {
      console.error('Submit error:', error)
      alert('Failed to save check-in: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pickups...</div>
        </div>
      </div>
    )
  }

  // Step 1: Select Reservation
  if (step === 'select') {
    return (
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <Link href="/guide" className="text-sm text-gray-500 mb-2 block">
            ← Back to Tours
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Select Pickup</h1>
          <p className="text-sm text-gray-500">
            {pendingCount === 0 ? 'All pickups complete!' : `${pendingCount} pending`}
          </p>
        </div>

        {/* Pending Reservations List */}
        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <span className="text-4xl block mb-3">✓</span>
            <p className="text-gray-900 font-medium text-lg">All pickups complete!</p>
            <p className="text-sm text-gray-500 mt-1">Ready for activities</p>
            <Link 
              href="/guide"
              className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((res) => {
              const stop = stops.find(s => s.id === res.pickup_stop_id)
              return (
                <button
                  key={res.id}
                  onClick={() => selectReservation(res)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{res.hotel_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{res.primary_contact_name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {res.adult_pax}A {res.child_pax > 0 ? `${res.child_pax}C` : ''} {res.infant_pax > 0 ? `${res.infant_pax}I` : ''}
                        {stop && ` • ${stop.scheduled_time?.slice(0, 5)}`}
                      </p>
                    </div>
                    <span className="text-blue-600 font-medium">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Step 2: Check-in Flow
  if (!selectedReservation) return null

  const stop = stops.find(s => s.id === selectedReservation.pickup_stop_id)

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-4">
        <button 
          onClick={() => setStep('select')} 
          className="text-sm text-gray-500 mb-2 block"
        >
          ← Back to List
        </button>
        <h1 className="text-xl font-bold text-gray-900">Pickup Check-in</h1>
      </div>

      {/* Reservation Card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
        <p className="font-semibold text-gray-900">{selectedReservation.hotel_name}</p>
        <p className="text-sm text-gray-600 mt-1">{selectedReservation.primary_contact_name}</p>
        <p className="text-xs text-gray-500 mt-2">
          {selectedReservation.adult_pax} adults {selectedReservation.child_pax > 0 ? `• ${selectedReservation.child_pax} children` : ''} {selectedReservation.infant_pax > 0 ? `• ${selectedReservation.infant_pax} infants` : ''}
        </p>
        {stop && <p className="text-xs text-gray-400 mt-1">Scheduled: {stop.scheduled_time?.slice(0, 5)}</p>}
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

      {/* Photo Upload - REQUIRED */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">📷 Photo Proof <span className="text-red-500">*</span></p>
        
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

      {/* Action Selection - Only after photo */}
      {photoUrl && location && (
        <div className="mb-4">
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
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
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
  )
}
