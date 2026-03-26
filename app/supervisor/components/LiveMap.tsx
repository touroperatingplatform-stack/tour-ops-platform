'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface GuideLocation {
  id: string
  guide_name: string
  tour_name: string
  lat: number
  lng: number
  status: 'on_time' | 'close' | 'late'
  pickup_time: string
  minutes_to_pickup: number
  checked_in_at: string
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])

  useEffect(() => {
    loadGuideLocations()
    const interval = setInterval(loadGuideLocations, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    console.log('[LiveMap] Loading for date:', today)
    
    // Get tours for today
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
    
    if (toursError) console.error('[LiveMap] Tours error:', toursError)
    console.log('[LiveMap] Tours found:', tours?.length || 0, tours)

    if (!tours || tours.length === 0) {
      setLocations([])
      return
    }

    const tourIds = tours.map((t: any) => t.id)
    console.log('[LiveMap] Tour IDs:', tourIds)
    
    // Get latest checkins for these tours
    const { data: checkins, error: checkinsError } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })
    
    if (checkinsError) console.error('[LiveMap] Checkins error:', checkinsError)
    console.log('[LiveMap] Checkins found:', checkins?.length || 0, checkins)

    // Get latest checkin per tour
    const latestCheckins = new Map()
    checkins?.forEach((c: any) => {
      if (!latestCheckins.has(c.tour_id)) {
        latestCheckins.set(c.tour_id, c)
      }
    })

    // Get guide names
    const guideIds = [...new Set(tours.map((t: any) => t.guide_id).filter(Boolean))]
    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
    
    const guideMap = new Map(guides?.map((g: any) => [g.id, g]) || [])
    const tourMap = new Map(tours.map((t: any) => [t.id, t]))

    const guideLocations: GuideLocation[] = []
    
    latestCheckins.forEach((checkin: any, tourId: string) => {
      const tour = tourMap.get(tourId)
      if (!tour) return
      
      const guide = guideMap.get(tour.guide_id)
      const pickupTime = new Date(`${today}T${tour.start_time}`)
      const now = new Date()
      const minutesToPickup = Math.floor((pickupTime.getTime() - now.getTime()) / 60000)
      
      let status: 'on_time' | 'close' | 'late' = 'on_time'
      if (minutesToPickup < 0) status = 'late'
      else if (minutesToPickup < 20) status = 'close'
      
      guideLocations.push({
        id: tour.guide_id,
        guide_name: guide ? `${guide.first_name} ${guide.last_name}` : 'Unknown',
        tour_name: tour.name,
        lat: checkin.latitude,
        lng: checkin.longitude,
        status,
        pickup_time: tour.start_time?.slice(0, 5),
        minutes_to_pickup: minutesToPickup,
        checked_in_at: checkin.checked_in_at,
      })
    })

    setLocations(guideLocations)
  }

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">No active guides with check-ins</p>
        <p className="text-sm text-gray-400 mt-1">Check-ins will appear here when guides update their location</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Live Guide Locations</h2>
        <p className="text-xs text-gray-500 mt-1">
          {locations.length} guides checked in
        </p>
      </div>
      
      <div className="p-4">
        {locations.map((guide) => (
          <div key={guide.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ 
                backgroundColor: guide.status === 'late' ? '#ef4444' : 
                                guide.status === 'close' ? '#eab308' : '#22c55e'
              }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{guide.guide_name}</p>
              <p className="text-xs text-gray-500">{guide.tour_name} • Pickup: {guide.pickup_time}</p>
              <p className="text-xs text-gray-400">
                📍 {guide.lat.toFixed(4)}, {guide.lng.toFixed(4)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
