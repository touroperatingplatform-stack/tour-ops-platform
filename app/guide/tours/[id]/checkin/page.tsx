'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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

interface Stop {
  id: string
  location_name: string
  scheduled_time: string
  stop_type: 'pickup' | 'activity' | 'dropoff'
  guest_count: number
}

export default function CheckinPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tourId = params.id as string
  const checkinType = (searchParams.get('type') as 'pickup' | 'activity' | 'dropoff') || 'pickup'

  // Step management
  const [step, setStep] = useState<'select' | 'checkin'>('select')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)

  // Data
  const [tour, setTour] = useState<Tour | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stops, setStops] = useState<Stop[]>([])
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
  
  // Activity checklist state
  const [activityChecklist, setActivityChecklist] = useState<any[]>([])
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  
  // Dropoff checklist state
  const [dropoffChecklist, setDropoffChecklist] = useState<any[]>([])
  const [dropoffCheckedItems, setDropoffCheckedItems] = useState<Record<string, boolean>>({})

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

    // Load stops based on checkin type
    let stopType: 'pickup' | 'activity' | 'dropoff' = 'pickup'
    if (checkinType === 'activity') stopType = 'activity'
    if (checkinType === 'dropoff') stopType = 'dropoff'
    
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, scheduled_time, stop_type, guest_count')
      .eq('tour_id', tourId)
      .eq('stop_type', stopType)
      .order('sort_order', { ascending: true })
    
    if (stopsData) {
      setStops(stopsData)
    }

    // Only load reservations for pickup check-ins
    if (checkinType === 'pickup') {
      const { data: resData } = await supabase
        .from('reservation_manifest')
        .select('id, primary_contact_name, adult_pax, child_pax, infant_pax, hotel_name, pickup_location, pickup_time, checked_in, no_show, pickup_stop_id')
        .eq('tour_id', tourId)
      
      if (resData) {
        // Filter pending (both checked_in and no_show must be explicitly false/null)
        const pending = resData.filter(r => r.checked_in !== true && r.no_show !== true)
        setReservations(pending)
        setPendingCount(pending.length)
      }
    } else {
      // For activity/dropoff, count stops without check-ins
      const { data: checkinsData } = await supabase
        .from('guide_checkins')
        .select('pickup_stop_id, checkin_type')
        .eq('tour_id', tourId)
        .eq('checkin_type', checkinType)
      
      const checkedInStopIds = new Set(checkinsData?.map(c => c.pickup_stop_id) || [])
      const pendingStops = (stopsData || []).filter(s => !checkedInStopIds.has(s.id))
      setPendingCount(pendingStops.length)
    }
    
    setLoading(false)
  }

  // Load activity checklist when activity stop selected
  async function loadActivityChecklist(stopId: string) {
    if (checkinType !== 'activity') return
    
    // Get the activity for this stop from tour_activities
    const { data: tourActivity } = await supabase
      .from('tour_activities')
      .select('activity_id, activities(name)')
      .eq('tour_id', tourId)
      .order('sort_order')
      .limit(1)
      .maybeSingle()
    
    if (!tourActivity) return
    
    // Get checklists for this activity - filter by stage in application code
    const { data: checklistLinks } = await supabase
      .from('activity_checklist_links')
      .select(`
        checklist_id,
        checklists!inner(id, items, name, stage)
      `)
      .eq('activity_id', tourActivity.activity_id)
    
    if (checklistLinks && checklistLinks.length > 0) {
      // Filter to only activity-stage checklists
      const activityStageLinks = checklistLinks.filter((link: any) => 
        link.checklists?.stage === 'activity'
      )
      
      const items: any[] = []
      activityStageLinks.forEach((link: any) => {
        if (link.checklists?.items) {
          link.checklists.items.forEach((item: any) => {
            items.push({
              ...item,
              checklist_name: link.checklists.name
            })
          })
        }
      })
      setActivityChecklist(items)
      const checked: Record<string, boolean> = {}
      items.forEach((item: any) => { checked[item.id] = false })
      setCheckedItems(checked)
    }
  }

  // Load dropoff checklist for this tour
  async function loadDropoffChecklist() {
    if (checkinType !== 'dropoff') return
    
    // Get checklists for any activity in this tour - filter by stage='dropoff'
    const { data: checklistLinks } = await supabase
      .from('activity_checklist_links')
      .select(`
        checklist_id,
        checklists!inner(id, items, name, stage)
      `)
      .in('activity_id', (await supabase
        .from('tour_activities')
        .select('activity_id')
        .eq('tour_id', tourId)
      ).data?.map((ta: any) => ta.activity_id) || [])
    
    if (checklistLinks && checklistLinks.length > 0) {
      // Filter to only dropoff-stage checklists
      const dropoffStageLinks = checklistLinks.filter((link: any) => 
        link.checklists?.stage === 'dropoff'
      )
      
      // Remove duplicates (same checklist linked to multiple activities)
      const seenChecklistIds = new Set<string>()
      const uniqueLinks = dropoffStageLinks.filter((link: any) => {
        if (seenChecklistIds.has(link.checklist_id)) return false
        seenChecklistIds.add(link.checklist_id)
        return true
      })
      
      const items: any[] = []
      uniqueLinks.forEach((link: any) => {
        if (link.checklists?.items) {
          link.checklists.items.forEach((item: any) => {
            items.push({
              ...item,
              checklist_name: link.checklists.name
            })
          })
        }
      })
      setDropoffChecklist(items)
      const checked: Record<string, boolean> = {}
      items.forEach((item: any) => { checked[item.id] = false })
      setDropoffCheckedItems(checked)
    }
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

  function selectStop(stop: Stop) {
    setSelectedStop(stop)
    setStep('checkin')
    getLocation() // Capture GPS when arriving at stop
    if (checkinType === 'activity') {
      loadActivityChecklist(stop.id) // Load checklist for activity
    } else if (checkinType === 'dropoff') {
      loadDropoffChecklist() // Load checklist for dropoff
    }
  }

  async function handleActivityCheckin() {
    if (!selectedStop) return
    if (!photoUrl) {
      alert('Please take a photo first')
      return
    }
    if (!location) {
      alert('Waiting for GPS. Please enable location services.')
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

      // Create guide checkin record for activity/dropoff
      const checkinData = {
        tour_id: tourId,
        brand_id: tourData?.brand_id,
        guide_id: user.id,
        pickup_stop_id: selectedStop.id,
        checkin_type: checkinType, // 'activity' or 'dropoff'
        checked_in_at: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
        location_accuracy: location.accuracy,
        selfie_url: photoUrl,
        notes: notes || null
      }
      
      const { error: checkinError } = await supabase.from('guide_checkins').insert(checkinData)

      if (checkinError) {
        console.error('Checkin insert error:', checkinError)
        throw new Error('Failed to save checkin: ' + (checkinError.message || JSON.stringify(checkinError)))
      }

      console.log(`${checkinType} check-in saved successfully`)

      // Back to tour page
      router.push(`/guide/tours/${tourId}`)
      
    } catch (error: any) {
      console.error('Submit error:', error)
      alert('Failed to save check-in: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    // Handle activity/dropoff check-ins separately
    if (checkinType === 'activity' || checkinType === 'dropoff') {
      return handleActivityCheckin()
    }
    
    // Original pickup check-in logic
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
    // Calculate if all required activity checklist items are checked
    const allActivityItemsChecked = activityChecklist.length === 0 || 
      activityChecklist.filter((item: any) => item.required).every((item: any) => checkedItems[item.id])

    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pickups...</div>
        </div>
      </div>
    )
  }

  // Step 1: Select Reservation or Stop
  if (step === 'select') {
    // For activity/dropoff check-ins
    if (checkinType === 'activity' || checkinType === 'dropoff') {
      return (
        <div className="p-4">
          {/* Header */}
          <div className="mb-4">
            <Link href={`/guide/tours/${tourId}`} className="text-sm text-gray-500 mb-2 block">
              ← Back to Tour
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              {checkinType === 'activity' ? 'Activity Check-in' : 'Dropoff Check-in'}
            </h1>
            <p className="text-sm text-gray-500">
              {pendingCount === 0 ? `All ${checkinType}s complete!` : `${pendingCount} pending`}
            </p>
          </div>

          {/* Pending Stops List */}
          {stops.length === 0 || pendingCount === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <span className="text-4xl block mb-3">✓</span>
              <p className="text-gray-900 font-medium text-lg">All {checkinType}s complete!</p>
              <p className="text-sm text-gray-500 mt-1">Ready for next phase</p>
              <Link 
                href={`/guide/tours/${tourId}`}
                className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Back to Tour
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => selectStop(stop)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{stop.location_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                      </p>
                    </div>
                    <span className="text-blue-600 font-medium">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Original pickup check-in
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
  // Handle activity/dropoff check-in UI
  if ((checkinType === 'activity' || checkinType === 'dropoff') && selectedStop) {
    // Calculate if all required activity checklist items are checked
    const allActivityItemsChecked = activityChecklist.length === 0 || 
      activityChecklist.filter((item: any) => item.required).every((item: any) => checkedItems[item.id])
    
    // Calculate if all required dropoff checklist items are checked
    const allDropoffItemsChecked = dropoffChecklist.length === 0 || 
      dropoffChecklist.filter((item: any) => item.required).every((item: any) => dropoffCheckedItems[item.id])
    
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
          <h1 className="text-xl font-bold text-gray-900">
            {checkinType === 'activity' ? 'Activity Check-in' : 'Dropoff Check-in'}
          </h1>
        </div>

        {/* Stop Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <p className="font-semibold text-gray-900">{selectedStop.location_name}</p>
          <p className="text-sm text-gray-500 mt-2">
            {selectedStop.scheduled_time?.slice(0, 5)} • {selectedStop.guest_count} guests
          </p>
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
              <img src={photoUrl} alt="Check-in" className="w-full h-48 object-cover rounded-lg" />
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

        {/* Activity Checklist */}
        {checkinType === 'activity' && activityChecklist.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">✓ Activity Checklist</p>
            <div className="space-y-2">
              {activityChecklist.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all"
                  style={{
                    borderColor: checkedItems[item.id] ? '#22c55e' : '#e5e7eb',
                    backgroundColor: checkedItems[item.id] ? '#f0fdf4' : 'white'
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    checkedItems[item.id] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {checkedItems[item.id] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm">{item.text}</span>
                  {item.required && (
                    <span className="text-xs text-orange-600 font-medium">Required</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dropoff Checklist */}
        {checkinType === 'dropoff' && dropoffChecklist.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">✓ Dropoff Checklist</p>
            <div className="space-y-2">
              {dropoffChecklist.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setDropoffCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all"
                  style={{
                    borderColor: dropoffCheckedItems[item.id] ? '#22c55e' : '#e5e7eb',
                    backgroundColor: dropoffCheckedItems[item.id] ? '#f0fdf4' : 'white'
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    dropoffCheckedItems[item.id] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {dropoffCheckedItems[item.id] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm">{item.text}</span>
                  {item.required && (
                    <span className="text-xs text-orange-600 font-medium">Required</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special notes..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleActivityCheckin}
          disabled={!photoUrl || !location || submitting || (checkinType === 'activity' && activityChecklist.length > 0 && !allActivityItemsChecked) || (checkinType === 'dropoff' && dropoffChecklist.length > 0 && !allDropoffItemsChecked)}
          className="w-full py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : checkinType === 'activity' ? 'Confirm Activity Check-in' : 'Confirm Dropoff'}
        </button>
      </div>
    )
  }

  // Original pickup check-in flow
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
