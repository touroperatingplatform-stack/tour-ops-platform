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

// Default Riviera Maya bounds
const DEFAULT_BOUNDS = {
  minLat: 20.0,
  maxLat: 21.5,
  minLng: -88.0,
  maxLng: -86.5,
}

// Reference locations
const REFERENCE_POINTS = [
  { name: 'Cancun', lat: 21.1619, lng: -86.8515 },
  { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739 },
  { name: 'Tulum', lat: 20.2114, lng: -87.4654 },
  { name: 'Chichen Itza', lat: 20.6843, lng: -88.5678 },
  { name: 'Coba', lat: 20.4945, lng: -87.7337 },
  { name: 'Isla Mujeres', lat: 21.2323, lng: -86.7315 },
]

// Calculate bounds from pins with padding
function calculateBounds(locations: GuideLocation[]) {
  if (locations.length === 0) return DEFAULT_BOUNDS
  
  const lats = locations.map(l => l.lat)
  const lngs = locations.map(l => l.lng)
  
  // Add 10% padding around pins
  const latPadding = (Math.max(...lats) - Math.min(...lats)) * 0.1 || 0.2
  const lngPadding = (Math.max(...lngs) - Math.min(...lngs)) * 0.1 || 0.2
  
  return {
    minLat: Math.min(...lats) - latPadding,
    maxLat: Math.max(...lats) + latPadding,
    minLng: Math.min(...lngs) - lngPadding,
    maxLng: Math.max(...lngs) + lngPadding,
  }
}

// Convert lat/lng to SVG coordinates (0-100%)
function latLngToSvg(lat: number, lng: number, bounds: typeof DEFAULT_BOUNDS) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
  const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)
  const [selectedGuide, setSelectedGuide] = useState<GuideLocation | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadGuideLocations()
    // Refresh every 2 minutes (not live tracking, just check-ins)
    const interval = setInterval(loadGuideLocations, 120000)
    return () => clearInterval(interval)
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
    
    if (!tours || tours.length === 0) {
      setLocations([])
      return
    }

    const tourIds = tours.map((t: any) => t.id)
    
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })

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

    // Auto-fit bounds to show all pins
    setBounds(calculateBounds(guideLocations))
    setLocations(guideLocations)
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
      
      <div className="flex-1 relative bg-blue-50 overflow-hidden">
        {/* SVG Map */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Water background with subtle land indication */}
          <rect width="100" height="100" fill="#e0f2fe" />
          
          {/* Subtle land/sea pattern */}
          <defs>
            <pattern id="water" patternUnits="userSpaceOnUse" width="10" height="10">
              <rect width="10" height="10" fill="#dbeafe"/>
              <circle cx="2" cy="2" r="0.5" fill="#93c5fd" opacity="0.3"/>
              <circle cx="7" cy="6" r="0.3" fill="#93c5fd" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#water)" />
          
          {/* Reference location labels */}
          {REFERENCE_POINTS.map((point) => {
            const pos = latLngToSvg(point.lat, point.lng, bounds)
            // Only show if within current bounds
            if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) return null
            return (
              <g key={point.name}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="0.8"
                  fill="#94a3b8"
                />
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  fontSize="2"
                  fill="#64748b"
                  textAnchor="middle"
                  className="font-medium"
                >
                  {point.name}
                </text>
              </g>
            )
          })}

          {/* Guide location pins */}
          {locations.map((guide) => {
            const pos = latLngToSvg(guide.lat, guide.lng, bounds)
            return (
              <g 
                key={guide.id}
                className="cursor-pointer"
                onClick={() => setSelectedGuide(guide)}
              >
                {/* Pin circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  fill={getStatusColor(guide.status)}
                  stroke="white"
                  strokeWidth="1"
                  className="hover:r-4 transition-all"
                />
                {/* Pulse effect for active tours */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="4"
                  fill="none"
                  stroke={getStatusColor(guide.status)}
                  strokeWidth="0.5"
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    values="4;6;4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
            <span>On time</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></span>
            <span>Close</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></span>
            <span>Late</span>
          </div>
        </div>

        {/* Selected guide info popup */}
        {selectedGuide && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{selectedGuide.guide_name}</h3>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-1">{selectedGuide.tour_name}</p>
            <p className="text-xs text-gray-500">Pickup: {selectedGuide.pickup_time}</p>
            <p className={`text-xs mt-2 ${
              selectedGuide.status === 'late' ? 'text-red-600' :
              selectedGuide.status === 'close' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {selectedGuide.minutes_to_pickup < 0 
                ? `${Math.abs(selectedGuide.minutes_to_pickup)} min late`
                : `${selectedGuide.minutes_to_pickup} min to pickup`
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Last check-in: {formatTimeAgo(selectedGuide.checked_in_at)}
            </p>
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
                className="w-3 h-3 rounded-full flex-shrink-0"
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
