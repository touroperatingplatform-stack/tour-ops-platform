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

// Default bounds if no pins (full tour area)
const DEFAULT_BOUNDS = {
  minLat: 20.0,
  maxLat: 21.2,
  minLng: -88.7,
  maxLng: -86.7,
}

// Calculate bounds from pins with 20% padding
function calculateBounds(locations: GuideLocation[]) {
  if (locations.length === 0) return DEFAULT_BOUNDS
  if (locations.length === 1) {
    // Single pin: show small area around it
    const pad = 0.05
    return {
      minLat: locations[0].lat - pad,
      maxLat: locations[0].lat + pad,
      minLng: locations[0].lng - pad,
      maxLng: locations[0].lng + pad,
    }
  }
  
  const lats = locations.map(l => l.lat)
  const lngs = locations.map(l => l.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // Add 20% padding
  const latPad = (maxLat - minLat) * 0.2 || 0.1
  const lngPad = (maxLng - minLng) * 0.2 || 0.1
  
  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  }
}

// Convert lat/lng to percentage (0-100%) using dynamic bounds
function latLngToPercent(lat: number, lng: number, bounds: typeof DEFAULT_BOUNDS) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
  const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100
  return { 
    x: Math.max(0, Math.min(100, x)), 
    y: Math.max(0, Math.min(100, y)) 
  }
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)
  const [selectedGuide, setSelectedGuide] = useState<GuideLocation | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadGuideLocations()
    const interval = setInterval(loadGuideLocations, 120000)
    return () => clearInterval(interval)
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    console.log('[LiveMap] Loading for date:', today)
    
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
    
    console.log('[LiveMap] Tours:', tours?.length || 0, tours)
    
    if (!tours || tours.length === 0) {
      setLocations([])
      return
    }

    const tourIds = tours.map((t: any) => t.id)
    
    const { data: checkins, error: checkinsError } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })

    console.log('[LiveMap] Checkins:', checkins?.length || 0, checkins)
    if (checkinsError) console.error('[LiveMap] Checkins error:', checkinsError)

    const latestCheckins = new Map()
    checkins?.forEach((c: any) => {
      if (!latestCheckins.has(c.tour_id)) {
        latestCheckins.set(c.tour_id, c)
      }
    })

    const guideIds = [...new Set(tours.map((t: any) => t.guide_id).filter(Boolean))]
    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', guideIds)
    
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

    // Calculate dynamic bounds based on pin locations
    const newBounds = calculateBounds(guideLocations)
    console.log('[LiveMap] Final locations:', guideLocations.length)
    console.log('[LiveMap] Dynamic bounds:', newBounds)
    
    // Log positions with new bounds
    guideLocations.forEach(guide => {
      const pos = latLngToPercent(guide.lat, guide.lng, newBounds)
      console.log('[LiveMap] Guide:', guide.guide_name, '→ X:', pos.x.toFixed(1) + '%', 'Y:', pos.y.toFixed(1) + '%')
    })
    
    setLocations(guideLocations)
    setBounds(newBounds)
    setLastUpdated(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'late': return '#ef4444'
      case 'close': return '#eab308'
      default: return '#22c55e'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center h-full flex flex-col justify-center">
        <p className="text-gray-500">No active guides with check-ins</p>
        <p className="text-sm text-gray-400 mt-1">Check-ins will appear here when guides update their location</p>
        <button 
          onClick={loadGuideLocations}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Guide Check-in Map</h2>
          <p className="text-xs text-gray-500">
            {locations.length} guides • Updated {formatTimeAgo(lastUpdated.toISOString())}
          </p>
        </div>
        <button 
          onClick={loadGuideLocations}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      {/* Map container */}
      <div className="flex-1 relative bg-blue-50 min-h-[300px]">
        {/* Simple grid background */}
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} 
        />
        
        {/* Map bounds indicator */}
        <div className="absolute inset-4 border-2 border-blue-200 rounded-lg pointer-events-none" />
        
        {/* Compass / orientation */}
        <div className="absolute top-2 right-2 text-xs text-blue-400 font-mono">
          N
        </div>

        {/* Pins */}
        {locations.map((guide) => {
          const pos = latLngToPercent(guide.lat, guide.lng, bounds)
          return (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
              style={{ 
                left: `${pos.x}%`, 
                top: `${pos.y}%`,
                zIndex: selectedGuide?.id === guide.id ? 50 : 10
              }}
              title={`${guide.guide_name} - ${guide.tour_name}`}
            >
              {/* Pin dot */}
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: getStatusColor(guide.status) }}
              />
              {/* Pulse ring */}
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-50"
                style={{ backgroundColor: getStatusColor(guide.status) }}
              />
            </button>
          )
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white"></span>
            <span>On time</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white"></span>
            <span>Close</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></span>
            <span>Late</span>
          </div>
        </div>

        {/* Selected guide popup */}
        {selectedGuide && (
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs z-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">{selectedGuide.guide_name}</h3>
                <p className="text-xs text-gray-600 truncate">{selectedGuide.tour_name}</p>
                <p className="text-xs text-gray-500 mt-1">Pickup: {selectedGuide.pickup_time}</p>
                <p className={`text-xs mt-1 font-medium ${
                  selectedGuide.status === 'late' ? 'text-red-600' :
                  selectedGuide.status === 'close' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {selectedGuide.minutes_to_pickup < 0 
                    ? `${Math.abs(selectedGuide.minutes_to_pickup)} min late`
                    : `${selectedGuide.minutes_to_pickup} min to pickup`
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  📍 {selectedGuide.lat.toFixed(4)}, {selectedGuide.lng.toFixed(4)}
                </p>
                <p className="text-xs text-gray-400">
                  Last check-in: {formatTimeAgo(selectedGuide.checked_in_at)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guide list */}
      <div className="border-t border-gray-200 p-3 shrink-0 max-h-32 overflow-auto">
        <div className="space-y-2">
          {locations.map((guide) => (
            <div 
              key={guide.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedGuide(guide)}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow"
                style={{ backgroundColor: getStatusColor(guide.status) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{guide.guide_name}</p>
                <p className="text-xs text-gray-500 truncate">{guide.tour_name}</p>
              </div>
              <span className="text-xs text-gray-400">{formatTimeAgo(guide.checked_in_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
