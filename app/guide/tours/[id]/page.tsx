'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  pickup_location: string
  acknowledged_at: string | null
  guide: { first_name: string; last_name: string } | null
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
}

interface ChecklistTemplate {
  id: string
  name: string
  items: { id: string; text: string; required: boolean }[]
}

interface ChecklistState {
  [key: string]: boolean
}

export default function GuideTourPage() {
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistTemplate | null>(null)
  const [checklistState, setChecklistState] = useState<ChecklistState>({})
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [equipmentPhoto, setEquipmentPhoto] = useState<string | null>(null)
  const [vanPhoto, setVanPhoto] = useState<string | null>(null)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  useEffect(() => {
    loadTour()
    loadReservations()
    loadChecklist()
    loadStops()
  }, [])

  async function loadChecklist() {
    // Load pre_departure checklist template
    const { data } = await supabase
      .from('checklists')
      .select('id, name, items')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (data) {
      setChecklist(data)
      // Initialize checklist state
      const state: ChecklistState = {}
      data.items.forEach((item: { id: string; text: string; required: boolean }) => {
        state[item.id] = false
      })
      setChecklistState(state)
    }
  }

  async function loadReservations() {
    const { data } = await supabase
      .from('reservation_manifest')
      .select('id, booking_reference, booking_platform, adult_pax, child_pax, infant_pax, total_pax, primary_contact_name, dietary_restrictions, accessibility_needs, special_requests, checked_in, no_show')
      .eq('tour_id', params.id)
      .order('booking_reference')
    
    if (data) setReservations(data)
  }

  async function loadStops() {
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id, location_name, address, scheduled_time, guest_count, stop_type, sort_order')
      .eq('tour_id', params.id)
      .order('sort_order', { ascending: true })
    
    if (stopsData) setStops(stopsData)

    // Load existing checkins
    const { data: checkinsData } = await supabase
      .from('guide_checkins')
      .select('id, pickup_stop_id, checkin_type, checked_in_at')
      .eq('tour_id', params.id)
    
    if (checkinsData) setCheckins(checkinsData)
  }

  async function toggleReservationCheckin(reservationId: string, checked: boolean) {
    const reservation = reservations.find(r => r.id === reservationId)
    if (!reservation) return

    const { error } = await supabase
      .from('reservation_manifest')
      .update({ 
        checked_in: checked,
        checked_in_at: checked ? new Date().toISOString() : null,
      })
      .eq('id', reservationId)
    
    if (!error) {
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, checked_in: checked } : r
      ))
    }
  }

  async function markNoShow(reservationId: string) {
    const { error } = await supabase
      .from('reservation_manifest')
      .update({ no_show: true })
      .eq('id', reservationId)
    
    if (!error) {
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, no_show: true } : r
      ))
    }
  }

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id, equipment_photo_url, van_photo_url, acknowledged_at, brand_id')
      .eq('id', params.id)
      .single()

    if (tourData) {
      if (tourData.guide_id) {
        const { data: guide } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', tourData.guide_id)
          .single()
        setTour({ ...tourData, guide })
      } else {
        setTour(tourData as any)
      }
      
      if (tourData.equipment_photo_url) setEquipmentPhoto(tourData.equipment_photo_url)
      if (tourData.van_photo_url) setVanPhoto(tourData.van_photo_url)

      // Check for existing checkins
      const { data: checkins } = await supabase
        .from('guide_checkins')
        .select('id')
        .eq('tour_id', params.id)
        .eq('checkin_type', 'pre_pickup')
        .limit(1)
      
      setHasCheckedIn(!!checkins && checkins.length > 0)
    }
    setLoading(false)
  }

  // Redirect to acknowledgment if not acknowledged
  if (tour && tour.status === 'scheduled' && !tour.acknowledged_at) {
    router.push(`/guide/tours/${params.id}/acknowledge`)
    return null
  }

  function toggleChecklistItem(itemId: string) {
    setChecklistState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  async function handlePhotoUpload(type: 'equipment' | 'van', file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
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
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function startTour() {
    // Check all required checklist items
    if (checklist) {
      const allRequired = checklist.items
        .filter(item => item.required)
        .every(item => checklistState[item.id])
      
      if (!allRequired) {
        alert('Please complete all required checklist items')
        return
      }
    }

    if (!equipmentPhoto || !vanPhoto) {
      alert('Please upload both required photos')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get brand_id from tour
    const { data: tourData } = await supabase
      .from('tours')
      .select('brand_id')
      .eq('id', params.id)
      .single()

    // Save checklist completion
    if (checklist && tourData) {
      await supabase
        .from('checklist_completions')
        .insert({
          tour_id: params.id,
          brand_id: tourData.brand_id,
          guide_id: user.id,
          template_id: checklist.id,
          stage: 'pre_departure',
          completed_at: new Date().toISOString(),
          is_confirmed: true
        })
    }

    // Create pre_departure checkin
    if (tourData) {
      await supabase
        .from('guide_checkins')
        .insert({
          tour_id: params.id,
          brand_id: tourData.brand_id,
          guide_id: user.id,
          checkin_type: 'pre_departure',
          checked_in_at: new Date().toISOString()
        })
    }

    // Update tour status
    const { error } = await supabase
      .from('tours')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      alert('Failed to start tour')
    } else {
      setTour(prev => prev ? { ...prev, status: 'in_progress' } : null)
    }
  }

  async function completeTour() {
    router.push(`/guide/tours/${params.id}/complete`)
  }

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

  const allRequiredChecked = checklist?.items
    .filter((item: { id: string; text: string; required: boolean }) => item.required)
    .every((item: { id: string; text: string; required: boolean }) => checklistState[item.id]) ?? true

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
        <p className="text-gray-500 mt-1">{tour.start_time?.slice(0, 5)} • {tour.pickup_location}</p>
      </div>

      {/* Status */}
      <div className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${
        tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
        tour.status === 'completed' ? 'bg-green-100 text-green-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {tour.status.replace('_', ' ')}
      </div>

      {/* Pre-Trip Checklist - Only show before tour starts */}
      {tour.status === 'scheduled' && checklist && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{checklist.name}</h2>
          <div className="space-y-3">
            {checklist.items.map((item: { id: string; text: string; required: boolean }) => (
              <label key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklistState[item.id] || false}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {item.text}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Photo Uploads - Only show when starting or in progress */}
      {(tour.status === 'scheduled' || tour.status === 'in_progress') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Required Photos</h2>
          
          {/* Equipment Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Check Photo</label>
            {equipmentPhoto ? (
              <div className="relative">
                <img src={equipmentPhoto} alt="Equipment" className="w-full h-48 object-cover rounded-lg" />
                <button 
                  onClick={() => setEquipmentPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  Retake
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">Tap to take photo</span>
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

          {/* Van Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photo</label>
            {vanPhoto ? (
              <div className="relative">
                <img src={vanPhoto} alt="Van" className="w-full h-48 object-cover rounded-lg" />
                <button 
                  onClick={() => setVanPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  Retake
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <span className="text-3xl mb-2">🚐</span>
                <span className="text-sm text-gray-500">Tap to take photo</span>
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
        </div>
      )}

      {/* Tour Stops - Only show when in progress */}
      {tour.status === 'in_progress' && stops.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tour Stops</h2>
          <div className="space-y-3">
            {stops.map((stop) => {
              const checkin = checkins.find(c => c.pickup_stop_id === stop.id)
              const isCheckedIn = !!checkin
              return (
                <div key={stop.id} className={`p-4 rounded-xl border-2 ${isCheckedIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {stop.stop_type === 'pickup' ? '📍' : stop.stop_type === 'activity' ? '🎯' : '🏁'}
                        </span>
                        <span className="font-medium">{stop.location_name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {stop.scheduled_time?.slice(0, 5)}
                        {stop.guest_count && ` • ${stop.guest_count} guests`}
                      </p>
                      {isCheckedIn && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Checked in at {new Date(checkin.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    {!isCheckedIn && (
                      <Link
                        href={`/guide/tours/${tour.id}/checkin?type=${stop.stop_type}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Check In
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reservation Manifest */}
      {reservations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Reservations</h2>
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-medium">
                  {reservations.filter(r => r.checked_in).length}/{reservations.length} 
                </span>
                reservations checked in
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div 
                key={reservation.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  reservation.no_show 
                    ? 'bg-red-50 border-red-200' 
                    : reservation.checked_in 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <label className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={reservation.checked_in}
                      onChange={(e) => toggleReservationCheckin(reservation.id, e.target.checked)}
                      disabled={reservation.no_show}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${reservation.no_show ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {reservation.primary_contact_name || 'Guest'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {reservation.booking_reference}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-blue-600">
                          {reservation.adult_pax}.{reservation.child_pax} PAX
                        </span>
                        {reservation.infant_pax > 0 && (
                          <span className="text-xs text-gray-500">+{reservation.infant_pax} infant</span>
                        )}
                      </div>
                      {reservation.dietary_restrictions?.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          🍽️ {reservation.dietary_restrictions.join(', ')}
                        </p>
                      )}
                      {reservation.special_requests && (
                        <p className="text-xs text-gray-500 mt-1">
                          📝 {reservation.special_requests}
                        </p>
                      )}
                    </div>
                  </label>
                  
                  {!reservation.checked_in && !reservation.no_show && tour?.status !== 'completed' && (
                    <button
                      onClick={() => markNoShow(reservation.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      No show
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {tour.status === 'scheduled' && (
          <button
            onClick={startTour}
            disabled={uploading || !equipmentPhoto || !vanPhoto || !allRequiredChecked}
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {uploading ? 'Uploading...' : 'Start Tour'}
          </button>
        )}
        {tour.status === 'in_progress' && (
          <div className="flex-1">
            {!hasCheckedIn ? (
              <Link
                href={`/guide/tours/${tour.id}/checkin`}
                className="block w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg font-semibold text-center"
              >
                📍 Check In at Pickup
              </Link>
            ) : (
              <button
                onClick={completeTour}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-colors text-lg font-semibold"
              >
                Complete Tour
              </button>
            )}
          </div>
        )}
        {['completed', 'cancelled'].includes(tour.status) && (
          <div className="flex-1 text-center text-gray-500 py-4">
            Tour {tour.status}
          </div>
        )}
      </div>

      {/* Report Incident */}
      {tour?.status !== 'completed' && tour?.status !== 'cancelled' && (
        <div className="space-y-3">
          <Link
            href={`/guide/tours/${tour?.id}/incident`}
            className="block w-full bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl hover:bg-red-100 transition-colors text-lg font-semibold text-center"
          >
            🚨 Report Incident
          </Link>
          
          <Link
            href={`/guide/tours/${tour?.id}/expense`}
            className="block w-full bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-4 rounded-xl hover:bg-blue-100 transition-colors text-lg font-semibold text-center"
          >
            💵 Log Expense
          </Link>
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