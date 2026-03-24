'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Tour {
  id: string
  name: string
  start_time: string
  tour_date: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickup_location: string
  dropoff_location: string
  capacity: number
  guest_count: number
  guide_id?: string
  vehicle_id?: string
  guide: { first_name: string; last_name: string; phone: string } | null
  vehicle: { plate_number: string; make: string; model: string } | null
}

export default function OperationsDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [alerts, setAlerts] = useState<any[]>([])

  const loadData = useCallback(async () => {
    // Get tours for selected date
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id, name, start_time, tour_date, status, pickup_location, dropoff_location,
        capacity, guest_count, guide_id, vehicle_id
      `)
      .eq('tour_date', selectedDate)
      .order('start_time')

    const toursWithData = await Promise.all((toursData || []).map(async (tour: any) => {
      let guide = null
      let vehicle = null
      
      if (tour.guide_id) {
        const { data: g } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', tour.guide_id)
          .single()
        guide = g
      }
      
      if (tour.vehicle_id) {
        const { data: v } = await supabase
          .from('vehicles')
          .select('plate_number, make, model')
          .eq('id', tour.vehicle_id)
          .single()
        vehicle = v
      }
      
      return { ...tour, guide, vehicle }
    }))

    setTours(toursWithData)

    // Get alerts (incidents, no guides, etc.)
    const { data: recentIncidents } = await supabase
      .from('incidents')
      .select('id, description, severity, created_at, tour:tours(name)')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    setAlerts(recentIncidents || [])
    setLoading(false)
  }, [selectedDate])

  useEffect(() => {
    loadData()
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const scheduledTours = tours.filter(t => t.status === 'scheduled')
  const inProgressTours = tours.filter(t => t.status === 'in_progress')
  const completedTours = tours.filter(t => t.status === 'completed')
  const cancelledTours = tours.filter(t => t.status === 'cancelled')

  const totalGuests = tours.reduce((sum, t) => sum + (t.guest_count || 0), 0)
  const unassignedGuides = tours.filter(t => !t.guide_id && t.status === 'scheduled').length
  const unassignedVehicles = tours.filter(t => !t.vehicle_id && t.status === 'scheduled').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>Loading operations dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Operations Center</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
              <p className="text-sm font-medium text-red-800">
                🚨 Incident on {alert.tour?.name}
              </p>
              <p className="text-xs text-red-600">{alert.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Critical Issues */}
      {(unassignedGuides > 0 || unassignedVehicles > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-orange-800 mb-2">⚠️ Attention Needed</h3>
          <div className="flex gap-4">
            {unassignedGuides > 0 && (
              <div className="text-orange-700">
                <span className="font-bold">{unassignedGuides}</span> tours need guides
              </div>
            )}
            {unassignedVehicles > 0 && (
              <div className="text-orange-700">
                <span className="font-bold">{unassignedVehicles}</span> tours need vehicles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <StatCard label="Scheduled" value={scheduledTours.length} color="blue" />
        <StatCard label="In Progress" value={inProgressTours.length} color="yellow" />
        <StatCard label="Completed" value={completedTours.length} color="green" />
        <StatCard label="Cancelled" value={cancelledTours.length} color="red" />
        <StatCard label="Guests" value={totalGuests} color="purple" />
      </div>

      {/* Timeline View */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Today's Timeline</h2>
        
        {tours.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No tours scheduled for this date</div>
        ) : (
          tours.map((tour) => (
            <div 
              key={tour.id} 
              className={`bg-white rounded-lg p-4 border-l-4 ${
                tour.status === 'in_progress' ? 'border-blue-500 shadow-md' :
                tour.status === 'completed' ? 'border-green-500' :
                tour.status === 'cancelled' ? 'border-red-500' :
                'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-gray-700">
                      {tour.start_time}
                    </span>
                    <span 
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tour.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tour.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="font-semibold text-gray-900 mt-1">{tour.name}</p>
                  
                  <div className="text-sm text-gray-500 mt-1">
                    📍 {tour.pickup_location} → {tour.dropoff_location || 'TBD'}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {tour.guide ? (
                      <div className="text-green-700">
                        👤 {tour.guide.first_name} {tour.guide.last_name}
                        {tour.guide.phone && <span className="text-gray-500"> • {tour.guide.phone}</span>}
                      </div>
                    ) : (
                      <div className="text-orange-600">⚠️ No guide assigned</div>
                    )}
                    
                    {tour.vehicle ? (
                      <div className="text-blue-700">
                        🚐 {tour.vehicle.plate_number}
                      </div>
                    ) : (
                      <div className="text-orange-600">⚠️ No vehicle assigned</div>
                    )}
                    
                    <div className="text-gray-600">
                      👥 {tour.guest_count || 0}/{tour.capacity}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/admin/tours/${tour.id}`}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg text-center"
                  >
                    Manage
                  </Link>
                  
                  {tour.status === 'scheduled' && (
                    <button
                      onClick={async () => {
                        await supabase.from('tours').update({ status: 'in_progress' }).eq('id', tour.id)
                        loadData()
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }

  return (
    <div className={`rounded-lg p-3 text-center border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
