'use client'

import { useEffect, useState, useRef } from 'react'
import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getLocalDate } from '@/lib/timezone'

// Fix Leaflet default marker icons
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

interface Incident {
  id: string
  tour_id: string
  tour_name: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: string
  lat?: number
  lng?: number
}

interface MissingCheckin {
  tour_id: string
  tour_name: string
  guide_name: string
  pickup_time: string
  pickup_location: string
  status: string
}

// Custom marker icons
const getGuideMarkerIcon = (status: string) => {
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

const getIncidentMarkerIcon = (severity: string) => {
  const color = severity === 'critical' ? '#dc2626' :
                severity === 'high' ? '#ea580c' :
                severity === 'medium' ? '#eab308' : '#6b7280'
  return L.divIcon({
    className: 'incident-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 14px;
    ">⚠️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

const getMissingCheckinIcon = () => {
  return L.divIcon({
    className: 'missing-checkin-marker',
    html: `<div style="
      width: 18px;
      height: 18px;
      background-color: #9ca3af;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// Component to update map bounds
function FitMapBounds({ locations, incidents, missing }: { 
  locations: GuideLocation[]
  incidents: Incident[]
  missing: MissingCheckin[]
}) {
  const map = useMap()
  
  useEffect(() => {
    const allPoints: [number, number][] = []
    
    locations.forEach(l => allPoints.push([l.lat, l.lng]))
    incidents.forEach(i => { if (i.lat && i.lng) allPoints.push([i.lat, i.lng]) })
    
    if (allPoints.length === 0) return
    
    if (allPoints.length === 1) {
      map.setView(allPoints[0], 10)
    } else {
      map.fitBounds(allPoints, { padding: [50, 50], maxZoom: 12 })
    }
  }, [locations, incidents, missing, map])
  
  return null
}

export default function LiveMap() {
  const mapRef = React.useRef<L.Map | null>(null)
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [missingCheckins, setMissingCheckins] = useState<MissingCheckin[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [mapCenter] = useState<[number, number]>([20.6, -87.7])
  
  // Layer visibility toggles
  const [showGuides, setShowGuides] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showMissing, setShowMissing] = useState(true)
  
  // Reset view to fit all markers
  const resetView = () => {
    if (!mapRef.current) return
    const allPoints: [number, number][] = []
    locations.forEach(l => allPoints.push([l.lat, l.lng]))
    incidents.forEach(i => { if (i.lat && i.lng) allPoints.push([i.lat, i.lng]) })
    
    if (allPoints.length === 0) {
      mapRef.current.setView([20.6, -87.7], 9)
    } else if (allPoints.length === 1) {
      mapRef.current.setView(allPoints[0], 10)
    } else {
      mapRef.current.fitBounds(allPoints, { padding: [50, 50], maxZoom: 12 })
    }
  }

  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadAllData, 120000)
    return () => clearInterval(interval)
  }, [])

  async function loadAllData() {
    const today = getLocalDate()
    const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]
    
    // Get all tours (query both today and tomorrow for timezone)
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id, pickup_location')
      .in('tour_date', [today, tomorrow])
      .in('status', ['in_progress', 'scheduled'])
    
    if (!tours || tours.length === 0) {
      setLocations([])
      setIncidents([])
      setMissingCheckins([])
      return
    }

    const tourIds = tours.map((t: any) => t.id)
    
    // Get check-ins
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })

    // Get incidents
    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, tour_id, type, severity, description, status, created_at')
      .in('tour_id', tourIds)
    
    // Get guides
    const guideIds = [...new Set(tours.map((t: any) => t.guide_id).filter(Boolean))]
    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', guideIds)
    
    const guideMap = new Map(guides?.map((g: any) => [g.id, g]) || [])
    const tourMap = new Map(tours.map((t: any) => [t.id, t]))
    
    // Get latest checkin per tour
    const latestCheckins = new Map()
    checkins?.forEach((c: any) => {
      if (!latestCheckins.has(c.tour_id)) {
        latestCheckins.set(c.tour_id, c)
      }
    })

    // Build guide locations (only if they have GPS coordinates)
    const guideLocations: GuideLocation[] = []
    const toursWithCheckins = new Set<string>()
    
    latestCheckins.forEach((checkin: any, tourId: string) => {
      const tour = tourMap.get(tourId)
      if (!tour) return
      
      // Skip check-ins without GPS coordinates
      if (!checkin.latitude || !checkin.longitude) {
        console.log(`Skipping check-in for tour ${tourId}: no GPS coordinates`)
        return
      }
      
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
      
      toursWithCheckins.add(tourId)
    })

    // Build incidents list
    const incidentList: Incident[] = []
    incidentsData?.forEach((i: any) => {
      const tour = tourMap.get(i.tour_id)
      const checkin = latestCheckins.get(i.tour_id)
      
      incidentList.push({
        id: i.id,
        tour_id: i.tour_id,
        tour_name: tour?.name || 'Unknown Tour',
        type: i.type,
        severity: i.severity,
        description: i.description,
        status: i.status,
        lat: checkin?.latitude,
        lng: checkin?.longitude,
      })
    })

    // Find tours without check-ins
    const missingList: MissingCheckin[] = []
    tours.forEach((t: any) => {
      if (!toursWithCheckins.has(t.id)) {
        const guide = guideMap.get(t.guide_id)
        missingList.push({
          tour_id: t.id,
          tour_name: t.name,
          guide_name: guide ? `${guide.first_name} ${guide.last_name}` : 'Unknown',
          pickup_time: t.start_time?.slice(0, 5),
          pickup_location: t.pickup_location || 'Unknown',
          status: t.status,
        })
      }
    })

    setLocations(guideLocations)
    setIncidents(incidentList)
    setMissingCheckins(missingList)
    setLastUpdated(new Date())
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

  const totalMarkers = locations.length + incidents.length + missingCheckins.length

  if (totalMarkers === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center h-full flex flex-col justify-center">
        <p className="text-gray-500">No active tours with data</p>
        <button 
          onClick={loadAllData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-gray-900">Operations Map</h2>
            <p className="text-xs text-gray-500">
              {locations.length} guides • {incidents.length} incidents • {missingCheckins.length} missing check-ins
            </p>
          </div>
          <button 
            onClick={loadAllData}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
        
        {/* Layer toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              Guides ({locations.length})
            </span>
          </label>
          
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span>
              Incidents ({incidents.length})
            </span>
          </label>
          
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showMissing}
              onChange={(e) => setShowMissing(e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              Missing ({missingCheckins.length})
            </span>
          </label>
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 min-h-[300px] relative">
        <MapContainer
          center={mapCenter}
          zoom={9}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          className="h-full w-full"
          style={{ height: '100%', minHeight: '300px' }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Zoom controls (top-right) */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
            <button
              onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() + 1)}
              className="w-8 h-8 bg-white rounded shadow-md border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() - 1)}
              className="w-8 h-8 bg-white rounded shadow-md border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={resetView}
              className="w-8 h-8 bg-white rounded shadow-md border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-50 mt-1"
              title="Reset view"
            >
              ⟲
            </button>
          </div>
          
          <FitMapBounds locations={locations} incidents={incidents} missing={missingCheckins} />
          
          {/* Guide check-in markers */}
          {showGuides && locations.map((guide) => (
            <Marker
              key={`guide-${guide.id}`}
              position={[guide.lat, guide.lng]}
              icon={getGuideMarkerIcon(guide.status)}
              eventHandlers={{ click: () => setSelectedItem({ type: 'guide', data: guide }) }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-sm">📍 {guide.guide_name}</p>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Checked in: {formatTimeAgo(guide.checked_in_at)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Incident markers */}
          {showIncidents && incidents.map((incident) => (
            <Marker
              key={`incident-${incident.id}`}
              position={incident.lat && incident.lng ? [incident.lat, incident.lng] : [20.6, -87.7]}
              icon={getIncidentMarkerIcon(incident.severity)}
              eventHandlers={{ click: () => setSelectedItem({ type: 'incident', data: incident }) }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-sm">⚠️ Incident</p>
                  <p className="text-xs text-gray-600">{incident.tour_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{incident.type}</p>
                  <p className={`text-xs mt-1 font-medium ${
                    incident.severity === 'critical' ? 'text-red-600' :
                    incident.severity === 'high' ? 'text-orange-600' :
                    incident.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    Severity: {incident.severity}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">{incident.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Status: {incident.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Missing check-in markers */}
          {showMissing && missingCheckins.map((missing) => (
            <Marker
              key={`missing-${missing.tour_id}`}
              position={[20.6296, -87.0739]} // Default to Playa del Carmen
              icon={getMissingCheckinIcon()}
              eventHandlers={{ click: () => setSelectedItem({ type: 'missing', data: missing }) }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-sm">⏳ No Check-in</p>
                  <p className="text-xs text-gray-600">{missing.tour_name}</p>
                  <p className="text-xs text-gray-500">Guide: {missing.guide_name}</p>
                  <p className="text-xs text-gray-500">Pickup: {missing.pickup_time}</p>
                  <p className="text-xs text-gray-500">Location: {missing.pickup_location}</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Guide hasn&apos;t checked in</p>
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

        {/* Selected item info */}
        {selectedItem && (
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs z-[1000]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {selectedItem.type === 'guide' && (
                  <>
                    <h3 className="font-semibold text-sm">📍 {selectedItem.data.guide_name}</h3>
                    <p className="text-xs text-gray-600">{selectedItem.data.tour_name}</p>
                  </>
                )}
                {selectedItem.type === 'incident' && (
                  <>
                    <h3 className="font-semibold text-sm">⚠️ {selectedItem.data.type}</h3>
                    <p className="text-xs text-gray-600">{selectedItem.data.tour_name}</p>
                  </>
                )}
                {selectedItem.type === 'missing' && (
                  <>
                    <h3 className="font-semibold text-sm">⏳ No Check-in</h3>
                    <p className="text-xs text-gray-600">{selectedItem.data.tour_name}</p>
                  </>
                )}
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom list */}
      <div className="border-t border-gray-200 p-3 shrink-0 max-h-32 overflow-auto">
        <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Active Guides</h3>
        <div className="space-y-2">
          {locations.map((guide) => (
            <div 
              key={guide.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedItem({ type: 'guide', data: guide })}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow" style={{ backgroundColor: 
                guide.status === 'late' ? '#ef4444' : guide.status === 'close' ? '#eab308' : '#22c55e'
              }} />
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
