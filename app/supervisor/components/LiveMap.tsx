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
  const [selectedGuide, setSelectedGuide] = useState<GuideLocation | null>(null)

  useEffect(() => {
    loadGuideLocations()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadGuideLocations, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    
    // Get tours with pickup check-in data
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id, pickup_checkin_lat, pickup_checkin_lng, pickup_checkin_status, pickup_checked_in_at')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
      .not('pickup_checkin_lat', 'is', null)

    if (!tours || tours.length === 0) {
      setLocations([])
      return
    }

    // Get guide names
    const guideIds = [...new Set(tours.map((t: any) => t.guide_id).filter(Boolean))]
    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
    
    const guideMap = new Map(guides?.map((g: any) => [g.id, g]) || [])

    const guideLocations: GuideLocation[] = tours.map((tour: any) => {
      const guide = guideMap.get(tour.guide_id)
      const pickupTime = new Date(`${today}T${tour.start_time}`)
      const now = new Date()
      const minutesToPickup = Math.floor((pickupTime.getTime() - now.getTime()) / 60000)
      
      let status: 'on_time' | 'close' | 'late' = tour.pickup_checkin_status || 'on_time'
      if (minutesToPickup < 0 && status === 'on_time') status = 'late'
      else if (minutesToPickup < 20 && status === 'on_time') status = 'close'
      
      return {
        id: tour.guide_id,
        guide_name: guide ? `${guide.first_name} ${guide.last_name}` : 'Unknown',
        tour_name: tour.name,
        lat: tour.pickup_checkin_lat,
        lng: tour.pickup_checkin_lng,
        status,
        pickup_time: tour.start_time?.slice(0, 5),
        minutes_to_pickup: minutesToPickup,
        checked_in_at: tour.pickup_checked_in_at,
      }
    })

    setLocations(guideLocations)
  }

  const statusColors = {
    on_time: '#22c55e',
    close: '#eab308', 
    late: '#ef4444',
  }

  const statusLabels = {
    on_time: 'On Time',
    close: 'Close',
    late: 'Late',
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Guide Locations
          </h2>
          <div className="flex gap-4 text-sm">
            {Object.entries(statusColors).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                {statusLabels[key as keyof typeof statusLabels]}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Last check-in positions • Updates every 30s
        </p>
      </div>
      
      <div className="p-4">
        {locations.map((guide) => (
          <div key={guide.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColors[guide.status] }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{guide.guide_name}</p>
              <p className="text-xs text-gray-500">{guide.tour_name} • Pickup: {guide.pickup_time}</p>
              <p className="text-xs text-gray-400">
                📍 {guide.lat.toFixed(4)}, {guide.lng.toFixed(4)}
              </p>
            </div>
            <span className="text-xs text-gray-400">{guide.pickup_time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
