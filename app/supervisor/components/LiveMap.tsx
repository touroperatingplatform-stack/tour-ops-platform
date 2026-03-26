'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons in Next.js
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src || markerIcon2x,
  iconUrl: markerIcon.src || markerIcon,
  shadowUrl: markerShadow.src || markerShadow,
})

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

// Custom marker colors based on status
const getMarkerIcon = (status: string) => {
  const color = status === 'late' ? '#ef4444' : 
                status === 'close' ? '#eab308' : '#22c55e'
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Component to update map bounds
function FitMapBounds({ locations }: { locations: GuideLocation[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length === 0) return
    
    const bounds = locations.map(l => [l.lat, l.lng] as [number, number])
    
    if (locations.length === 1) {
      // Single pin: zoom in close
      map.setView(bounds[0], 10)
    } else {
      // Multiple pins: fit all with padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [locations, map])
  
  return null
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [selectedGuide, setSelectedGuide] = useState<GuideLocation | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [mapCenter] = useState<[number, number]>([20.6, -87.7]) // Yucatan center

  useEffect(() => {
    loadGuideLocations()
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
      
      <div className="flex-1 min-h-[300px] relative">
        <MapContainer
          center={mapCenter}
          zoom={9}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ height: '100%', minHeight: '300px' }}
        >
          {/* OpenStreetMap tiles - free, open source, no API key */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Auto-fit bounds to show all pins */}
          <FitMapBounds locations={locations} />
          
          {/* Guide pins */}
          {locations.map((guide) => (
            <Marker
              key={guide.id}
              position={[guide.lat, guide.lng]}
              icon={getMarkerIcon(guide.status)}
              eventHandlers={{
                click: () => setSelectedGuide(guide)
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-sm">{guide.guide_name}</p>
                  <p className="text-xs text-gray-600">{guide.tour_name}</p>
                  <p className="text-xs text-gray-500">Pickup: {guide.pickup_time}</p>
                  <p className={`text-xs mt-1 font-medium ${
                    guide.status === 'late' ? 'text-red-600' :
                    guide.status === 'close' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {guide.minutes_to_pickup < 0 
                      ? `${Math.abs(guide.minutes_to_pickup)} min late`
                      : `${guide.minutes_to_pickup} min to pickup`
                    }
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 z-[1000] text-xs">
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

        {/* Selected guide info */}
        {selectedGuide && (
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs z-[1000]">
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
