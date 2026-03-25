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
}

export default function LiveMap() {
  const [locations, setLocations] = useState<GuideLocation[]>([])
  const [selectedGuide, setSelectedGuide] = useState<GuideLocation | null>(null)

  useEffect(() => {
    loadGuideLocations()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('guide_checkins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guide_checkins' }, () => {
        loadGuideLocations()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadGuideLocations() {
    const today = new Date().toISOString().split('T')[0]
    
    // Get active tours with latest check-in
    const { data: tours } = await supabase
      .from('tours')
      .select(`
        id, name, start_time, status,
        guide:guide_id (id, first_name, last_name),
        checkins:guide_checkins (latitude, longitude, checked_in_at, scheduled_time)
      `)
      .eq('tour_date', today)
      .in('status', ['in_progress', 'scheduled'])
      .order('created_at', { foreignTable: 'guide_checkins', ascending: false })
      .limit(1, { foreignTable: 'guide_checkins' })

    if (!tours) return

    const guideLocations: GuideLocation[] = tours.map((tour: any) => {
      const checkin = tour.checkins?.[0]
      const pickupTime = new Date(`${today}T${tour.start_time}`)
      const now = new Date()
      const minutesToPickup = Math.floor((pickupTime.getTime() - now.getTime()) / 60000)
      
      let status: 'on_time' | 'close' | 'late' = 'on_time'
      if (minutesToPickup < 0) status = 'late'
      else if (minutesToPickup < 20) status = 'close'
      
      return {
        id: tour.guide.id,
        guide_name: `${tour.guide.first_name} ${tour.guide.last_name}`,
        tour_name: tour.name,
        lat: checkin?.latitude || 21.16, // Default to Cancun area
        lng: checkin?.longitude || -86.82,
        status,
        pickup_time: tour.start_time?.slice(0, 5),
        minutes_to_pickup: minutesToPickup,
      }
    })

    setLocations(guideLocations)
  }

  const statusColors = {
    on_time: '#22c55e', // green
    close: '#eab308',   // yellow
    late: '#ef4444',    // red
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Guide Locations
        </h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> On Time
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Close
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Late
          </span>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden">
        {/* Static Map - In production, use Google Maps or Mapbox */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://mt1.google.com/vt/lyrs=m&x=0&y=0&z=1)',
            backgroundSize: '400%',
            backgroundPosition: 'center',
          }}
        >
          {/* Guide Pins */}
          {locations.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
              style={{
                left: `${((guide.lng + 86.9) / 0.2) * 100}%`,
                top: `${((21.2 - guide.lat) / 0.1) * 100}%`,
              }}
            >
              <div 
                className="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: statusColors[guide.status] }}
              >
                👤
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {guide.guide_name}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Guide Info */}
        {selectedGuide && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedGuide.guide_name}</h3>
                <p className="text-sm text-gray-600">{selectedGuide.tour_name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Pickup: {selectedGuide.pickup_time} 
                  {selectedGuide.minutes_to_pickup > 0 
                    ? `(${selectedGuide.minutes_to_pickup} min)` 
                    : `(${Math.abs(selectedGuide.minutes_to_pickup)} min late)`
                  }
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
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        Note: Using approximate coordinates. Integrate Google Maps API for accurate display.
      </p>
    </div>
  )
}
