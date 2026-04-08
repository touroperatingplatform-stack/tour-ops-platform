'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { compressImage } from '@/lib/image-compression'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  pickup_location: string
  acknowledged_at: string | null
  brand_id: string
  activity_type: string
  tour_date: string
  vehicle_id: string | null
  vehicles?: { plate_number: string; model: string }
}

interface TourEquipment {
  id: string
  name: string
  description: string | null
  sort_order: number
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

interface Reservation {
  id: string
  booking_reference: string
  booking_platform: string
  adult_pax: number
  child_pax: number
  infant_pax: number
  total_pax: number
  primary_contact_name: string
  dietary_restrictions: string[]
  accessibility_needs: string[]
  special_requests: string | null
  checked_in: boolean
  no_show: boolean
  pickup_location: string | null
}

// Pre-departure checklist items (always shown)
const preDepartureItems = [
  { id: 'van_inspection', label: 'Van Inspection', description: 'Tires, fuel, cleanliness', icon: '🚐' },
  { id: 'first_aid', label: 'First Aid Kit', description: 'Present and stocked', icon: '🩹' },
  { id: 'emergency_contacts', label: 'Emergency Contacts', description: 'Reviewed', icon: '📞' },
  { id: 'guest_manifest', label: 'Guest Manifest', description: 'Reviewed', icon: '📋' },
]

export default function GuideTourPage() {
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [equipmentPhoto, setEquipmentPhoto] = useState<string | null>(null)
  const [vanPhoto, setVanPhoto] = useState<string | null>(null)
  const [tourEquipment, setTourEquipment] = useState<TourEquipment[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  // Checklist state
  const [preDepartureChecked, setPreDepartureChecked] = useState<Record<string, boolean>>({})
  const [equipmentChecked, setEquipmentChecked] = useState<Record<string, boolean>>({})
  const [equipmentItems, setEquipmentItems] = useState<any[]>([])

  // Guest manifest expanded
  const [showGuestManifest, setShowGuestManifest] = useState(false)

  useEffect(() => {
    loadTour()
    loadReservations()
    loadStops()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('*, vehicles(plate_number, model)')
      .eq('id', params.id)
      .single()

    if (tourData) {
      setTour(tourData)
      
      if (tourData.equipment_photo_url) setEquipmentPhoto(tourData.equipment_photo_url)
      if (tourData.van_photo_url) setVanPhoto(tourData.van_photo_url)

      // Load tour-specific equipment
      if (tourData.brand_id && tourData.activity_type) {
        const { data: equipment } = await supabase
          .from('tour_equipment')
          .select('id, name, description, sort_order')
          .eq('brand_id', tourData.brand_id)
          .eq('activity_type', tourData.activity_type)
          .eq('is_active', true)
          .order('sort_order')
        
        if (equipment) {
          setTourEquipment(equipment)
          // Initialize equipment checked state
          const checked: Record<string, boolean> = {}
          equipment.forEach(item => { checked[item.id] = false })
          setEquipmentChecked(checked)
        }
      }
    }
    setLoading(false)
  }

  async function loadReservations() {
    const { data } = await supabase
      .from('reservation_manifest')
      .select('id, booking_reference, booking_platform, adult_pax, child_pax, infant_pax, total_pax, primary_contact_name, dietary_restrictions, accessibility_needs, special_requests, checked_in, no_show, pickup_location, hotel_name')
      .eq('tour_id', params.id)
      .order('booking_reference')
    
    if (data) setReservations(data)
  }

  async function loadEquipmentChecklist() {
    const { data } = await supabase
      .from('tour_equipment_checklists')
      .select('items, completed_items, is_completed')
      .eq('tour_id', params.id)
      .is('activity_id', null)
      .maybeSingle()
    
    if (data?.items) {
      // Initialize checked state from saved progress
      const checked: Record<string, boolean> = {}
      data.completed_items?.forEach((item: any) => {
        checked[item.id] = true
      })
      setPreDepartureChecked(checked)
      setEquipmentItems(data.items)
    }
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
        <Link href="/guide" className="text-blue-600 hover:underline">
          ← Back to my tours
        </Link>
      </div>
    )
  }

  if (tour.status === 'scheduled' && !tour.acknowledged_at) {
    router.push(`/guide/tours/${params.id}/acknowledge`)
    return null
  }

  function togglePreDeparture(itemId: string) {
    setPreDepartureChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  function toggleEquipment(itemId: string) {
    setEquipmentChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  async function handlePhotoUpload(type: 'equipment' | 'van', file: File) {
    setUploading(true)
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxFileSizeMB: 2
      })
      
      console.log('Tour Start photo compressed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      })
      
      const url = await uploadToCloudinary(compressedFile)
      if (type === 'equipment') {
        setEquipmentPhoto(url)
      } else {
        setVanPhoto(url)
      }
      await supabase
        .from('tours')
        .update({ [type === 'equipment' ? 'equipment_photo_url' : 'van_photo_url']: url })
        .eq('id', params.id)
    } catch (err) {
      console.error('Photo upload error:', err)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const allPreDepartureDone = preDepartureItems.every(item => preDepartureChecked[item.id])
  const allEquipmentDone = equipmentItems.length === 0 || equipmentItems.every((item: any) => preDepartureChecked[item.id])
  const allPhotosDone = equipmentPhoto && vanPhoto
  const canStartTour = allPreDepartureDone && allEquipmentDone && allPhotosDone

  async function startTour() {
    if (!canStartTour || !tour) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save checklist completion
    await supabase.from('tour_equipment_checklists').upsert({
      tour_id: params.id,
      items: equipmentItems,
      completed_items: equipmentItems.filter((item: any) => preDepartureChecked[item.id]),
      is_completed: true,
      completed_at: new Date().toISOString(),
      guide_id: user.id
    }, { onConflict: 'tour_id' })

    // Create pre_departure checkin
    await supabase.from('guide_checkins').insert({
      tour_id: params.id,
      brand_id: tour.brand_id,
      guide_id: user.id,
      checkin_type: 'pre_departure',
      checked_in_at: new Date().toISOString()
    })

    // Update tour status
    const { error } = await supabase
      .from('tours')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      alert('Failed to start tour')
    } else {
      router.push('/guide')
    }
  }

  // Phase management
  const pickupStops = stops.filter(s => s.stop_type === 'pickup')
  const activityStops = stops.filter(s => s.stop_type === 'activity')
  const dropoffStops = stops.filter(s => s.stop_type === 'dropoff')
  
  // Check if all pickups are done (all reservations complete)
  const completedReservations = reservations.filter(r => r.checked_in || r.no_show)
  const allPickupsDone = reservations.length > 0 && completedReservations.length === reservations.length
  
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
  
  // Check if a stop has any incomplete check-ins
  const getPendingCountForStop = (stop: Stop) => {
    // For pickups: Match reservations to stop by pickup_location OR hotel_name
    if (stop.stop_type === 'pickup') {
      const stopReservations = reservations.filter(r => {
        const pickupLoc = (r.pickup_location || '').toLowerCase().trim()
        const hotelName = ((r as any).hotel_name || '').toLowerCase().trim()
        const stopName = stop.location_name.toLowerCase().trim()
        
        // Exact match
        const matchPickup = pickupLoc && pickupLoc === stopName
        const matchHotel = hotelName && hotelName === stopName
        
        // Partial match (one contains the other)
        const partialMatch = (pickupLoc && (pickupLoc.includes(stopName) || stopName.includes(pickupLoc))) ||
                            (hotelName && (hotelName.includes(stopName) || stopName.includes(hotelName)))
        
        return matchPickup || matchHotel || partialMatch
      })
      const pending = stopReservations.filter(r => !r.checked_in && !r.no_show)
      return { total: stopReservations.length, pending: pending.length }
    }
    
    // For activities and dropoffs: Check if there's a guide_checkin for this stop
    const hasCheckin = checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === stop.stop_type)
    return { total: 1, pending: hasCheckin ? 0 : 1 }
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
            <p className="text-gray-500 mt-1">
              {new Date(tour.tour_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {tour.vehicles && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                🚐 {tour.vehicles.plate_number} • {tour.vehicles.model}
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            tour.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {tour.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Tour Start Wizard - Only show when scheduled */}
      {tour.status === 'scheduled' && (
        <>
          {/* Pre-Departure Checklist */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h2 className="font-semibold text-gray-900 text-lg">Pre-Departure Checklist</h2>
            </div>
            <div className="space-y-3">
              {preDepartureItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => togglePreDeparture(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    preDepartureChecked[item.id]
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    preDepartureChecked[item.id]
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}>
                    {preDepartureChecked[item.id] && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tour Equipment Checklist */}
          {equipmentItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">Tour Equipment Checklist</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Equipment needed based on tour activities
              </p>
              <div className="space-y-3">
                {equipmentItems.map((item: any) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      preDepartureChecked[item.id]
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => togglePreDeparture(item.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        preDepartureChecked[item.id]
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {preDepartureChecked[item.id] && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.text}</div>
                      {item.activity && item.activity !== 'Pre-Departure' && (
                        <div className="text-xs text-blue-600 font-medium">
                          📍 {item.activity}
                        </div>
                      )}
                    </div>
                    {item.photo_required && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        📷 Photo required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Photos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h2 className="font-semibold text-gray-900 text-lg">Required Photos</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Van Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Van Photo</label>
                {vanPhoto ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={vanPhoto} alt="Van" className="w-full h-32 object-cover" />
                    <button 
                      onClick={() => setVanPhoto(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      ⟳
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Captured
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <span className="text-3xl mb-1">🚐</span>
                    <span className="text-sm text-gray-500">Tap to capture</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload('van', e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Equipment Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Photo</label>
                {equipmentPhoto ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={equipmentPhoto} alt="Equipment" className="w-full h-32 object-cover" />
                    <button 
                      onClick={() => setEquipmentPhoto(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      ⟳
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Captured
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <span className="text-3xl mb-1">🎒</span>
                    <span className="text-sm text-gray-500">Tap to capture</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload('equipment', e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Start Tour Button */}
          <button
            onClick={startTour}
            disabled={!canStartTour || uploading}
            className={`w-full py-6 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-3 ${
              canStartTour && !uploading
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <>
                <span className="animate-spin">⟳</span>
                Uploading photos...
              </>
            ) : canStartTour ? (
              <>
                <span className="text-2xl">🚐</span>
                START TOUR
              </>
            ) : (
              'Complete all steps above to start'
            )}
          </button>
        </>
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
                <div className="text-sm text-gray-500 mt-1">
                  {completedReservations.length}/{reservations.length} done
                </div>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-300 text-xl">→</div>
              
              {/* Phase 2: Activities */}
              <div className={`flex-1 p-3 rounded-xl border-2 ${
                currentPhase === 'activities' ? 'bg-blue-50 border-blue-200' :
                allActivitiesDone ? 'bg-green-50 border-green-200' : 
                allPickupsDone ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{allActivitiesDone ? '✅' : '🎯'}</span>
                  <span className={`font-medium ${currentPhase === 'activities' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Activities
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {completedActivities.length}/{activityStops.length} done
                </div>
              </div>
              
              {/* Arrow */}
              <div className={`text-xl ${allPickupsDone ? 'text-gray-300' : 'text-gray-200'}`}>→</div>
              
              {/* Phase 3: Dropoffs */}
              <div className={`flex-1 p-3 rounded-xl border-2 ${
                currentPhase === 'dropoffs' ? 'bg-blue-50 border-blue-200' :
                allDropoffsDone ? 'bg-green-50 border-green-200' :
                allPickupsDone && allActivitiesDone ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{allDropoffsDone ? '✅' : '🏁'}</span>
                  <span className={`font-medium ${currentPhase === 'dropoffs' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Dropoffs
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {completedDropoffs.length}/{dropoffStops.length} done
                </div>
              </div>
            </div>
          </div>

          {/* Phase 1: Pickups */}
          {currentPhase === 'pickups' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Pickups</h2>
                  <p className="text-sm text-gray-500">Complete all pickups to unlock activities</p>
                </div>
              </div>
              <div className="space-y-3">
                {pickupStops.map((stop) => {
                  const { total, pending } = getPendingCountForStop(stop)
                  const isComplete = pending === 0 && total > 0
                  
                  return (
                    <div key={stop.id} className={`p-4 rounded-xl border-2 ${
                      isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📍</span>
                          <div>
                            <div className="font-medium text-gray-900">{stop.location_name}</div>
                            <div className="text-sm text-gray-500">
                              {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                              {total > 0 && ` • ${total - pending}/${total} done`}
                            </div>
                          </div>
                        </div>
                        {isComplete ? (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Done
                          </div>
                        ) : (
                          <Link
                            href={`/guide/tours/${tour.id}/checkin?type=pickup`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            {pending > 0 ? `${pending} pending` : 'Check In'}
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
                {pickupStops.length === 0 && (
                  <div className="text-center p-6 text-gray-500">
                    No pickup stops for this tour
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Activities (locked until pickups done) */}
          {currentPhase === 'pickups' ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-bold">🔒</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-700 text-lg">Activities</h2>
                  <p className="text-sm text-gray-500">Complete all pickups to unlock</p>
                </div>
              </div>
              <div className="space-y-3">
                {activityStops.map((stop) => (
                  <div key={stop.id} className="p-4 rounded-xl border-2 border-gray-200 bg-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl grayscale">🎯</span>
                      <div>
                        <div className="font-medium text-gray-500">{stop.location_name}</div>
                        <div className="text-sm text-gray-400">
                          {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activityStops.length === 0 && (
                  <div className="text-center p-6 text-gray-400">
                    No activities for this tour
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentPhase === 'activities' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <span className={`font-bold ${currentPhase === 'activities' ? 'text-blue-600' : 'text-green-600'}`}>
                    {currentPhase === 'activities' ? '2' : '✓'}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    {currentPhase === 'activities' ? 'Activities' : 'Activities ✅ Done'}
                  </h2>
                  {currentPhase === 'activities' && (
                    <p className="text-sm text-gray-500">Complete all activities to unlock dropoffs</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {activityStops.map((stop) => {
                  const hasCheckin = checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === 'activity')
                  
                  return (
                    <div key={stop.id} className={`p-4 rounded-xl border-2 ${
                      hasCheckin ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <div className="font-medium text-gray-900">{stop.location_name}</div>
                            <div className="text-sm text-gray-500">
                              {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                            </div>
                          </div>
                        </div>
                        {hasCheckin ? (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Done
                          </div>
                        ) : (
                          <Link
                            href={`/guide/tours/${tour.id}/checkin?type=activity`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Check In
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
                {activityStops.length === 0 && (
                  <div className="text-center p-6 text-gray-500">
                    No activities for this tour
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 3: Dropoffs (locked until activities done) */}
          {(currentPhase === 'pickups' || currentPhase === 'activities') ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-bold">🔒</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-700 text-lg">Dropoffs</h2>
                  <p className="text-sm text-gray-500">Complete all activities to unlock</p>
                </div>
              </div>
              <div className="text-center p-6 text-gray-400">
                Dropoffs will appear here after activities are complete
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  !allDropoffsDone ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <span className={`font-bold ${!allDropoffsDone ? 'text-blue-600' : 'text-green-600'}`}>
                    {!allDropoffsDone ? '3' : '✓'}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    {!allDropoffsDone ? 'Dropoffs' : 'Dropoffs ✅ Done'}
                  </h2>
                  {!allDropoffsDone && (
                    <p className="text-sm text-gray-500">Complete all dropoffs to finish tour</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {dropoffStops.map((stop) => {
                  const hasCheckin = checkins.some(c => c.pickup_stop_id === stop.id && c.checkin_type === 'dropoff')
                  
                  return (
                    <div key={stop.id} className={`p-4 rounded-xl border-2 ${
                      hasCheckin ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏁</span>
                          <div>
                            <div className="font-medium text-gray-900">{stop.location_name}</div>
                            <div className="text-sm text-gray-500">
                              {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                            </div>
                          </div>
                        </div>
                        {hasCheckin ? (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Done
                          </div>
                        ) : (
                          <Link
                            href={`/guide/tours/${tour.id}/checkin?type=dropoff`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Check In
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
                {dropoffStops.length === 0 && (
                  <div className="text-center p-6 text-gray-500">
                    No dropoffs for this tour
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Manifest */}
          {reservations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <button
                onClick={() => setShowGuestManifest(!showGuestManifest)}
                className="w-full flex items-center justify-between"
              >
                <div>
                  <h2 className="font-semibold text-gray-900">Guest Manifest</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {reservations.filter(r => r.checked_in).length}/{reservations.length} checked in
                  </p>
                </div>
                <span className={`transform transition-transform ${showGuestManifest ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showGuestManifest && (
                <div className="mt-4 space-y-3">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className={`p-3 rounded-xl border ${
                      reservation.no_show ? 'bg-red-50 border-red-200' :
                      reservation.checked_in ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {reservation.primary_contact_name || 'Guest'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.adult_pax}A {reservation.child_pax > 0 ? `${reservation.child_pax}C` : ''} {reservation.infant_pax > 0 ? `${reservation.infant_pax}I` : ''}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.no_show ? 'bg-red-100 text-red-700' :
                          reservation.checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {reservation.no_show ? 'No Show' : reservation.checked_in ? 'Checked In' : 'Pending'}
                        </div>
                      </div>
                      {reservation.dietary_restrictions?.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          🍽️ {reservation.dietary_restrictions.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Complete Tour Button - Only show when all phases done */}
          {allPickupsDone && allActivitiesDone && allDropoffsDone ? (
            <Link
              href={`/guide/tours/${tour.id}/complete`}
              className="block w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg text-center hover:bg-green-700"
            >
              🚐 Complete Tour
            </Link>
          ) : (
            <div className="block w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold text-lg text-center cursor-not-allowed">
              Complete all phases to finish tour
            </div>
          )}
        </>
      )}

      {/* Completed */}
      {tour.status === 'completed' && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h2 className="text-xl font-bold text-gray-900">Tour Completed</h2>
          <p className="text-gray-500 mt-1">Great work!</p>
        </div>
      )}

      <Link
        href="/guide"
        className="block text-center text-gray-600 hover:text-gray-900 text-sm py-4"
      >
        ← Back to My Tours
      </Link>
    </div>
  )
}
