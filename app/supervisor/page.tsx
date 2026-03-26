'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LiveMap from './components/LiveMap'

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

interface IncidentWithDetails {
  id: string
  reported_at: string
  tour_name: string
  severity: string
  status: string
  title: string
  guide_name: string
}

interface DashboardStats {
  total_tours: number
  total_guests: number
  in_progress: number
  open_incidents: number
  no_shows: number
  pending_checkins: number
}

export default function SupervisorDashboard() {
  const [tours, setTours] = useState<TourWithDetails[]>([])
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_tours: 0,
    total_guests: 0,
    in_progress: 0,
    open_incidents: 0,
    no_shows: 0,
    pending_checkins: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0]

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
      
      const totalGuests = formattedTours.reduce((sum, t) => sum + (t.guest_count || 0), 0)
      const inProgress = formattedTours.filter(t => t.status === 'in_progress').length
      const scheduled = formattedTours.filter(t => t.status === 'scheduled').length
      
      setStats(prev => ({
        ...prev,
        total_tours: formattedTours.length,
        total_guests: totalGuests,
        in_progress: inProgress,
        pending_checkins: scheduled
      }))
    }

    const { data: incidentsData } = await supabase
      .from('incidents')
      .select(`
        id, reported_at, severity, status, title,
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

  function getSeverityBadge(severity: string) {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] || styles.low}`}>
        {severity}
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
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="space-y-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Summary Metrics - Fixed colors */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium">Total Tours</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_tours}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-blue-600 uppercase font-medium">Expected Guests</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_guests}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-red-600 uppercase font-medium">No Shows</p>
            <p className="text-2xl font-bold text-red-600">{stats.no_shows}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-yellow-600 uppercase font-medium">Pending Check-In</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_checkins}</p>
          </div>
        </div>
      </div>

      {/* Row 1: Today's Tours + Live Map - Fills remaining space */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
            <h2 className="font-semibold text-gray-900 text-sm">Today's Tours</h2>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Tour Name</th>
                  <th className="px-3 py-2 font-medium">Guide</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Guests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{tour.start_time?.slice(0, 5)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{tour.name}</td>
                    <td className="px-3 py-2 text-gray-600">{tour.guide.first_name} {tour.guide.last_name}</td>
                    <td className="px-3 py-2">{getStatusBadge(tour.status)}</td>
                    <td className="px-3 py-2 text-right">{tour.guest_count || '-'}</td>
                  </tr>
                ))}
                {tours.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500 text-sm">No tours scheduled today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <LiveMap />
      </div>

      {/* Row 2: Incident Reports + Compliance - Fills remaining space */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-gray-900 text-sm">Incident Reports</h2>
            {stats.open_incidents > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{stats.open_incidents} open</span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Tour</th>
                  <th className="px-3 py-2 font-medium">Severity</th>
                  <th className="px-3 py-2 font-medium">Issue</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.slice(0, 5).map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{incident.tour_name}</td>
                    <td className="px-3 py-2">{getSeverityBadge(incident.severity)}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{incident.title}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href="/supervisor/incidents"
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500 text-sm">No incidents reported.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 overflow-auto">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Compliance Checklist</h2>
            <div className="space-y-2">
              {[
                { label: 'Vehicle check', status: 'completed' },
                { label: 'Safety gear verified', status: 'completed' },
                { label: 'Itinerary reviewed', status: 'pending' },
                { label: 'Cash counted', status: 'pending' },
                { label: 'Guide check-in', status: 'in_progress' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    item.status === 'completed' ? 'bg-green-500 text-white' :
                    item.status === 'in_progress' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {item.status === 'completed' ? '✓' : item.status === 'in_progress' ? '◐' : '○'}
                  </span>
                  <span className={`text-sm ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 overflow-auto">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Guest Feedback</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Overall Rating</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">92%</p>
                  <span className="text-xs text-green-600">↑ 3%</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-500 mb-1">Recent Comment</p>
                <blockquote className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">"Amazing tour! Guide was very knowledgeable."</blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
