'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface TourWithDetails {
  id: string
  name: string
  operator_name?: string
  start_time: string
  status: string
  guest_count: number
  actual_guest_count?: number
  guide: {
    first_name: string
    last_name: string
  }
}

interface IncidentWithDetails {
  id: string
  reported_at: string
  tour_name: string
  severity: string
  status: string
  title: string
  description: string
  guide_name: string
}

interface DashboardStats {
  total_tours: number
  total_guests: number
  actual_guests: number
  no_shows: number
  pending_checkins: number
  in_progress: number
  completed: number
  open_incidents: number
}

export default function SupervisorDashboard() {
  const [tours, setTours] = useState<TourWithDetails[]>([])
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_tours: 0,
    total_guests: 0,
    actual_guests: 0,
    no_shows: 0,
    pending_checkins: 0,
    in_progress: 0,
    completed: 0,
    open_incidents: 0
  })
  const [loading, setLoading] = useState(true)
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'high' | 'open'>('all')

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]

    // Load tours with guide info
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
      
      // Calculate stats
      const totalGuests = formattedTours.reduce((sum, t) => sum + (t.guest_count || 0), 0)
      const inProgress = formattedTours.filter(t => t.status === 'in_progress').length
      const completed = formattedTours.filter(t => t.status === 'completed').length
      const scheduled = formattedTours.filter(t => t.status === 'scheduled').length
      
      setStats(prev => ({
        ...prev,
        total_tours: formattedTours.length,
        total_guests: totalGuests,
        in_progress: inProgress,
        completed: completed,
        pending_checkins: scheduled
      }))
    }

    // Load incidents
    const { data: incidentsData } = await supabase
      .from('incidents')
      .select(`
        id, reported_at, severity, status, title, description,
        tour:tour_id (name),
        guide:guide_id (first_name, last_name)
      `)
      .gte('reported_at', `${today}T00:00:00`)
      .order('reported_at', { ascending: false })

    if (incidentsData) {
      const formattedIncidents = incidentsData.map((i: any) => ({
        ...i,
        tour_name: i.tour?.[0]?.name || 'Unknown',
        guide_name: `${i.guide?.[0]?.first_name || ''} ${i.guide?.[0]?.last_name || ''}`.trim() || 'Unknown'
      })) as IncidentWithDetails[]
      
      setIncidents(formattedIncidents)
      
      const openCount = formattedIncidents.filter(i => 
        ['reported', 'acknowledged', 'in_progress'].includes(i.status)
      ).length
      
      setStats(prev => ({ ...prev, open_incidents: openCount }))
    }

    setLoading(false)
  }

  const filteredIncidents = incidents.filter(i => {
    if (incidentFilter === 'high') return i.severity === 'high' || i.severity === 'critical'
    if (incidentFilter === 'open') return ['reported', 'acknowledged', 'in_progress'].includes(i.status)
    return true
  })

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  function getSeverityBadge(severity: string) {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || 'bg-gray-100'}`}>
        {severity}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Tours</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_tours}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Guests</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total_guests}</p>
          <p className="text-xs text-gray-400">expected</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-green-600">{stats.in_progress}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Open Incidents</p>
          <p className="text-2xl font-bold text-red-600">{stats.open_incidents}</p>
          {stats.open_incidents > 0 && (
            <p className="text-xs text-red-500">needs attention</p>
          )}
        </div>
      </div>

      {/* Today's Tours Widget */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Today's Tours</h2>
          <span className="text-sm text-gray-500">{tours.length} tours</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Tour Name</th>
                <th className="px-4 py-3 font-medium">Guide</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Guests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{tour.start_time?.slice(0, 5)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{tour.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tour.guide.first_name} {tour.guide.last_name}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(tour.status)}</td>
                  <td className="px-4 py-3 text-sm text-right">{tour.guest_count || '-'}</td>
                </tr>
              ))}
              {tours.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No tours scheduled today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Reports Widget */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Incident Reports</h2>
            {stats.open_incidents > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                {stats.open_incidents} open
              </span>
            )}
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'high', 'open'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setIncidentFilter(filter)}
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  incidentFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Tour</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Reported By</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIncidents.slice(0, 5).map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{incident.tour_name}</td>
                  <td className="px-4 py-3">{getSeverityBadge(incident.severity)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {incident.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{incident.guide_name}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/supervisor/incidents`}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No incidents reported
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredIncidents.length > 5 && (
          <div className="px-4 py-3 border-t border-gray-200 text-center">
            <Link 
              href="/supervisor/incidents"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all {filteredIncidents.length} incidents →
            </Link>
          </div>
        )}
      </div>

      {/* Guest Summary Widget */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-blue-100 text-sm">Expected Guests</p>
            <p className="text-3xl font-bold">{stats.total_guests}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">No Shows</p>
            <p className="text-3xl font-bold">{stats.no_shows}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Pending Check-in</p>
            <p className="text-3xl font-bold">{stats.pending_checkins}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
