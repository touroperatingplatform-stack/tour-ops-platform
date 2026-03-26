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
    console.log('Loading map for date:', today)
    
    // Get active tours
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guide_id')
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])

    console.log('Tours found:', tours?.length || 0)
    if (!tours || tours.length === 0) return

    // Get latest checkins for these tours
    const tourIds = tours.map((t: any) => t.id)
    console.log('Tour IDs:', tourIds)
    
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('tour_id, latitude, longitude, checked_in_at, scheduled_time, minutes_early_or_late')
      .in('tour_id', tourIds)
      .order('checked_in_at', { ascending: false })

    console.log('Checkins found:', checkins?.length || 0)

    // Get guide info
    const guideIds = [...new Set(tours.map((t: any) => t.guide_id).filter(Boolean))]
    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])

    const guideMap = new Map(guides?.map((g: any) => [g.id, g]) || [])
    
    // Get latest checkin per tour
    const latestCheckins = new Map()
    checkins?.forEach((c: any) => {
      if (!latestCheckins.has(c.tour_id)) {
        latestCheckins.set(c.tour_id, c)
      }
    })

    const guideLocations: GuideLocation[] = tours
      .filter((tour: any) => latestCheckins.has(tour.id))
      .map((tour: any) => {
        const checkin = latestCheckins.get(tour.id)
        const guide = guideMap.get(tour.guide_id)
        const pickupTime = new Date(`${today}T${tour.start_time}`)
        const now = new Date()
        const minutesToPickup = Math.floor((pickupTime.getTime() - now.getTime()) / 60000)
        
        let status: 'on_time' | 'close' | 'late' = 'on_time'
        if (minutesToPickup < 0) status = 'late'
        else if (minutesToPickup < 20) status = 'close'
        
        return {
          id: tour.guide_id,
          guide_name: guide ? `${guide.first_name} ${guide.last_name}` : 'Unknown',
          tour_name: tour.name,
          lat: checkin?.latitude || 21.16,
          lng: checkin?.longitude || -86.82,
          status,
          pickup_time: tour.start_time?.slice(0, 5),
          minutes_to_pickup: minutesToPickup,
          checked_in_at: checkin?.checked_in_at,
        }
      })

    console.log('Tours with checkins:', guideLocations.length)
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

  // Static map using OpenStreetMap (completely free)
  // In production, you could use Leaflet for interactive map
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
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
      
      {/* Map - Using OpenStreetMap static tiles (FREE) */}
      <div className="relative h-96 bg-gray-100">
        {/* OpenStreetMap tile - completely free, no API key */}
        <img 
          src="https://tile.openstreetmap.org/12/1200/1800.png"
          alt="Map"
          className="w-full h-full object-cover"
          style={{ 
            backgroundImage: 'url(https://tile.openstreetmap.org/12/1200/1800.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Guide Pins */}
        {locations.map((guide, index) => {
          // Simple positioning - distribute pins evenly
          const top = 20 + (index * 25) % 60
          const left = 15 + (index * 30) % 70
          
          return (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${top}%`, left: `${left}%` }}
            >
              <div 
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-110"
                style={{ backgroundColor: statusColors[guide.status] }}
              >
                👤
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {guide.guide_name}
              </div>
            </button>
          )
        })}
        
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No active guides with check-ins</p>
          </div>
        )}
        
        {/* Selected Guide Info */}
        {selectedGuide && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedGuide.guide_name}</h3>
                <p className="text-sm text-gray-600">{selectedGuide.tour_name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  📍 {selectedGuide.lat.toFixed(4)}, {selectedGuide.lng.toFixed(4)}
                </p>
                <p className="text-sm text-gray-500">
                  ⏰ Pickup: {selectedGuide.pickup_time}
                  {selectedGuide.minutes_to_pickup > 0 
                    ? ` (${selectedGuide.minutes_to_pickup} min)` 
                    : selectedGuide.minutes_to_pickup < 0 
                      ? ` (${Math.abs(selectedGuide.minutes_to_pickup)} min late)` 
                      : ' (now)'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Checked in: {new Date(selectedGuide.checked_in_at).toLocaleTimeString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Guide List Below Map */}
      <div className="p-4 border-t border-gray-200 max-h-48 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Guides ({locations.length})</h3>
        <div className="space-y-2">
          {locations.map(guide => (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
 >
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: statusColors[guide.status] }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{guide.guide_name}</p>
                <p className="text-xs text-gray-500 truncate">{guide.tour_name}</p>
              </div>
              <span className="text-xs text-gray-400">{guide.pickup_time}</span>
            </button>
          ))}
          {locations.length === 0 && (
            <p className="text-gray-500 text-sm">No guides currently checked in</p>
          )}
        </div>
      </div>
    </div>
  )
}
