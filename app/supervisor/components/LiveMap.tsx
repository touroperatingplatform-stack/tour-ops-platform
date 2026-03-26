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
      <div className="flex-1 relative bg-blue-200 min-h-[300px] overflow-hidden">
        {/* SVG Map Background - Yucatan Peninsula */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Ocean */}
          <rect width="100" height="100" fill="#bfe3f5" />
          
          {/* Yucatan Peninsula - more accurate coastline */}
          <path
            d="M 5,45 
               C 8,42 12,40 18,38
               C 25,35 32,32 38,30
               C 42,28 45,25 48,22
               C 50,20 52,18 55,17
               C 58,16 62,15 68,14
               C 72,13 76,12 80,11
               C 85,10 88,9 90,8
               L 92,10 C 90,12 88,14 85,16
               C 82,18 78,20 74,22
               C 70,25 66,28 62,32
               C 58,36 55,40 52,45
               C 50,50 48,55 47,60
               C 46,65 46,70 47,74
               C 48,78 50,82 53,85
               C 56,88 60,90 65,92
               L 65,95 C 60,93 55,90 50,86
               C 45,82 40,77 36,71
               C 32,65 28,58 25,52
               C 22,48 18,46 15,45
               C 12,44 8,44 5,45 Z"
            fill="#7cb86a"
            stroke="#5a9a4a"
            strokeWidth="0.3"
          />
          
          {/* Isla Mujeres (small island north-east) */}
          <ellipse cx="78" cy="18" rx="1.5" ry="0.8" fill="#7cb86a" stroke="#5a9a4a" strokeWidth="0.2" />
          
          {/* Cozumel (island east of Playa) */}
          <ellipse cx="88" cy="55" rx="2" ry="1.5" fill="#7cb86a" stroke="#5a9a4a" strokeWidth="0.2" />
          
          {/* Cenotes (inland water features) */}
          <circle cx="35" cy="50" r="0.8" fill="#4a90a4" opacity="0.5" />
          <circle cx="42" cy="55" r="0.6" fill="#4a90a4" opacity="0.5" />
          <circle cx="48" cy="60" r="0.7" fill="#4a90a4" opacity="0.5" />
          <circle cx="55" cy="65" r="0.5" fill="#4a90a4" opacity="0.5" />
          
          {/* Chichen Itza marker area (inland west) */}
          <circle cx="25" cy="48" r="1.5" fill="#c9a66b" opacity="0.4" />
        </svg>

        {/* Compass / orientation */}
        <div className="absolute top-2 right-2 text-xs text-white font-bold drop-shadow-md bg-black/20 px-2 py-1 rounded">
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
