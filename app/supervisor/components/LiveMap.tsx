'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { supabase } from '@/lib/supabase/client'
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
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5, -87.0]) // Cancun area

  useEffect(() => {
    loadGuideLocations()
    const interval = setInterval(loadGuideLocations, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    
    // Get tours for today
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
    
    if (toursError || !tours || tours.length === 0) {
      setLocations([])
      return
    }

    const tourIds = tours.map((t: any) => t.id)
    
    // Get latest checkins for these tours
    const { data: checkins, error: checkinsError } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })
    
    if (checkinsError || !checkins) {
      setLocations([])
      return
    }

    // Get latest checkin per tour
    const latestCheckins = new Map()
    checkins.forEach((c: any) => {
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
    let totalLat = 0, totalLng = 0, count = 0
    
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
      
      totalLat += checkin.latitude
      totalLng += checkin.longitude
      count++
    })

    // Center map on average location of guides
    if (count > 0) {
      setMapCenter([totalLat / count, totalLng / count])
    }
    
    setLocations(guideLocations)
  }

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center h-full flex flex-col justify-center">
        <p className="text-gray-500">No active guides with check-ins</p>
        <p className="text-sm text-gray-400 mt-1">Check-ins will appear here when guides update their location</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h2 className="font-semibold text-gray-900">Live Guide Locations</h2>
        <p className="text-xs text-gray-500 mt-1">
          {locations.length} guides checked in
        </p>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <MapContainer
          center={mapCenter}
          zoom={10}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ height: '100%', minHeight: '300px' }}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((guide) => (
            <Marker
              key={guide.id}
              position={[guide.lat, guide.lng]}
              icon={getMarkerIcon(guide.status)}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold">{guide.guide_name}</p>
                  <p className="text-sm text-gray-600">{guide.tour_name}</p>
                  <p className="text-sm">Pickup: {guide.pickup_time}</p>
                  <p className={`text-xs mt-1 ${
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
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200 z-[1000]">
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
      </div>
    </div>
  )
}
