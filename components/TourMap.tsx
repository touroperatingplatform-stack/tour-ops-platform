'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPoint {
  lat: number | null
  lng: number | null
  name: string
  type: 'stop' | 'checkin'
  scheduled_time?: string | null
  stop_type?: string
  checked_in_at?: string
  selfie_url?: string | null
  minutes_early_or_late?: number | null
}

interface TourMapProps {
  points: MapPoint[]
  tourName: string
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons
const stopIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-sm">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const checkinIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-sm">✓</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

export default function TourMap({ points, tourName }: TourMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize map if not already
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [21.1619, -86.8515], // Cancun area
        zoom: 12,
      })

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current)
    }

    // Clear existing markers
    const existingMarkers: L.Marker[] = []
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        existingMarkers.push(layer)
      }
    })
    existingMarkers.forEach((marker) => marker.remove())

    // Add markers for each point
    const bounds: L.LatLngBoundsExpression = []

    points.forEach((point) => {
      if (point.lat && point.lng) {
        const icon = point.type === 'stop' ? stopIcon : checkinIcon
        const marker = L.marker([point.lat, point.lng], { icon })

        // Create popup content
        let popupContent = `<div class="p-2">
          <div class="font-semibold">${point.name}</div>`
        
        if (point.type === 'stop' && point.scheduled_time) {
          popupContent += `<div class="text-sm text-gray-500">Scheduled: ${point.scheduled_time}</div>`
        }
        
        if (point.type === 'checkin' && point.checked_in_at) {
          popupContent += `<div class="text-sm text-gray-500">Checked in: ${new Date(point.checked_in_at).toLocaleTimeString()}</div>`
        }
        
        if (point.minutes_early_or_late !== null && point.minutes_early_or_late !== undefined) {
          const mins = point.minutes_early_or_late
          const color = mins > 5 ? 'text-red-600' : mins < -5 ? 'text-green-600' : 'text-gray-500'
          popupContent += `<div class="text-sm ${color}">${mins > 0 ? '+' : ''}${mins} min</div>`
        }
        
        popupContent += `</div>`

        marker.bindPopup(popupContent)
        marker.addTo(mapRef.current!)

        bounds.push([point.lat, point.lng])
      }
    })

    // Fit bounds if we have points
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] })
    }

    // Cleanup
    return () => {
      // Map instance persists between renders
    }
  }, [points])

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
  )
}