'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LiveMap from '../supervisor/components/LiveMap'
import { IncidentAlerts, GuideCheckinStatus, OperationsMetrics } from './components/OperationsEnhancements'

interface TourWithDetails {
  id: string
  name: string
  start_time: string
  status: string
  guest_count: number
  guide: {
    first_name: string
    last_name: string
  }
}

interface Vehicle {
  id: string
  make: string
  model: string
  plate_number: string
  status: 'available' | 'in_use' | 'maintenance'
  capacity: number
}

interface TimelineEvent {
  time: string
  event: string
  tour: string
  status: 'completed' | 'current' | 'upcoming'
}

export default function OperationsDashboard() {
  const [tours, setTours] = useState<TourWithDetails[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active_tours: 0,
    vehicles_in_use: 0,
    guides_on_duty: 0,
    delayed_tours: 0
  })

  useEffect(() => {
    loadOperationsData()
  }, [])

  async function loadOperationsData() {
    // Get today's date in Cancun timezone (where tours are scheduled)
    const now = new Date()
    const cancunDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Cancun' }))
    const today = cancunDate.toISOString().split('T')[0]

    // Load tours
    const { data: toursData } = await supabase
      .from('tours')
      .select(`
        id, name, start_time, status, guest_count,
        guide:guide_id (first_name, last_name)
      `)
      .eq('tour_date', today)
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) {
      const formattedTours = toursData.map((t: any) => ({
        ...t,
        guide: t.guide?.[0] || { first_name: 'Unknown', last_name: '' }
      })) as TourWithDetails[]
      
      setTours(formattedTours)
      
      const activeTours = formattedTours.filter(t => t.status === 'in_progress').length
      const delayedTours = formattedTours.filter(t => t.status === 'delayed').length
      const guidesOnDuty = new Set(formattedTours.map(t => t.guide.first_name)).size
      
      setStats(prev => ({
        ...prev,
        active_tours: activeTours,
        guides_on_duty: guidesOnDuty,
        delayed_tours: delayedTours
      }))

      // Generate timeline
      const timelineEvents: TimelineEvent[] = formattedTours.map(t => {
        const tourTime = new Date(`${today}T${t.start_time}`)
        const now = new Date()
        let eventStatus: TimelineEvent['status']
        
        if (t.status === 'completed') {
          eventStatus = 'completed'
        } else if (t.status === 'in_progress') {
          eventStatus = 'current'
        } else {
          eventStatus = tourTime < now ? 'completed' : 'upcoming'
        }
        
        return {
          time: t.start_time?.slice(0, 5),
          event: t.status === 'in_progress' ? 'Departed' : t.status === 'completed' ? 'Completed' : 'Scheduled',
          tour: t.name,
          status: eventStatus
        }
      })
      setTimeline(timelineEvents)
    }

    // Load vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, model, plate_number, status, capacity')

    if (vehiclesData) {
      const formattedVehicles = vehiclesData.map((v: any) => ({
        id: v.id,
        make: v.model.split(' ')[0] || '',
        model: v.model,
        plate_number: v.plate_number,
        status: v.status === 'active' ? 'available' : v.status,
        capacity: v.capacity
      }))
      setVehicles(formattedVehicles)
      const inUse = formattedVehicles.filter((v: any) => v.status === 'in_use').length
      setStats(prev => ({ ...prev, vehicles_in_use: inUse }))
    }

    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      scheduled: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      delayed: 'bg-yellow-100 text-yellow-700'
    }
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      delayed: 'Delayed'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`}>
        {labels[status] || status}
      </span>
    )
  }

  function getVehicleStatusBadge(status: string) {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      in_use: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4 w-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-blue-600 uppercase font-medium">Active Tours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active_tours}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-green-600 uppercase font-medium">Vehicles In Use</p>
            <p className="text-2xl font-bold text-green-600">{stats.vehicles_in_use}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-purple-600 uppercase font-medium">Guides On Duty</p>
            <p className="text-2xl font-bold text-purple-600">{stats.guides_on_duty}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-yellow-600 uppercase font-medium">Delayed</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.delayed_tours}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced 3-Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-auto">
        {/* Left Column - Live Map (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <LiveMap />
        </div>

        {/* Right Column - Panels (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 overflow-auto">
          {/* Incident Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shrink-0">
            <IncidentAlerts onIncidentUpdate={loadOperationsData} />
          </div>

          {/* Operations Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shrink-0">
            <OperationsMetrics />
          </div>

          {/* Guide Check-ins */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shrink-0">
            <GuideCheckinStatus />
          </div>
        </div>

        {/* Bottom Row - Timeline + Active Tours + Vehicles */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Timeline */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm">Today's Timeline</h2>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="relative">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {timeline.map((event, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-6">
                      <div className={`absolute left-0 w-4 h-4 rounded-full border-2 ${
                        event.status === 'completed' ? 'bg-gray-400 border-gray-400' :
                        event.status === 'current' ? 'bg-blue-500 border-blue-500' :
                        'bg-white border-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{event.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                            event.status === 'current' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {event.event}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{event.tour}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Tours */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm">Active Tours</h2>
              {stats.active_tours > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{stats.active_tours} active</span>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tour</th>
                    <th className="px-3 py-2 font-medium">Guide</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tours.filter(t => t.status === 'in_progress').map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{tour.name}</td>
                      <td className="px-3 py-2 text-gray-600">{tour.guide.first_name} {tour.guide.last_name}</td>
                      <td className="px-3 py-2">{getStatusBadge(tour.status)}</td>
                    </tr>
                  ))}
                  {tours.filter(t => t.status === 'in_progress').length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No active tours.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Fleet */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm">Vehicle Fleet</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Plate</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{vehicle.make} {vehicle.model}</td>
                      <td className="px-3 py-2 text-gray-600">{vehicle.plate_number}</td>
                      <td className="px-3 py-2">{getVehicleStatusBadge(vehicle.status)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{vehicle.capacity}</td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No vehicles registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
