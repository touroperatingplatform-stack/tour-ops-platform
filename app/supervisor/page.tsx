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
  guide_id: string
  guide: {
    first_name: string
    last_name: string
  }
}

interface IncidentWithDetails {
  id: string
  created_at: string
  type: string
  description: string
  severity: string
  status: string
  tour_id: string
  tour_name: string
  reported_by: string
  guide_name: string
}

interface ActiveGuide {
  id: string
  name: string
  tour: string
  lastCheckIn: string
  status: 'active' | 'idle' | 'offline'
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
  const [activeGuides, setActiveGuides] = useState<ActiveGuide[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
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
    // Query for both today and tomorrow to handle timezone mismatch
    // Tours created in Cancun (UTC-5) may be stored as next day in UTC
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guest_count, guide_id')
      .in('tour_date', [today, tomorrow])
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) {
      // Get only the guides referenced in these tours (not all guides)
      const guideIds = [...new Set(toursData.map(t => t.guide_id).filter(Boolean))]
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])

      const guideMap = new Map(guidesData?.map((g: any) => [g.id, g]) || [])

      const formattedTours = toursData.map((t: any) => {
        const guide = guideMap.get(t.guide_id)
        return {
          ...t,
          guide: guide || { first_name: 'Unknown', last_name: '' }
        }
      }) as TourWithDetails[]
      
      setTours(formattedTours)
      
      // Count actual guests from guests table, not guest_count column (which may be outdated)
      const { count: actualGuestCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .in('tour_id', formattedTours.map(t => t.id))
      
      const totalGuests = actualGuestCount || 0
      const inProgress = formattedTours.filter(t => t.status === 'in_progress').length
      const scheduled = formattedTours.filter(t => t.status === 'scheduled').length
      
      setStats(prev => ({
        ...prev,
        total_tours: formattedTours.length,
        total_guests: totalGuests,
        in_progress: inProgress,
        pending_checkins: scheduled
      }))

      const activeGuidesList = formattedTours
        .filter(t => t.status === 'in_progress')
        .map(t => ({
          id: t.id,
          name: `${t.guide.first_name} ${t.guide.last_name}`,
          tour: t.name,
          lastCheckIn: '5 min ago',
          status: 'active' as const
        }))
      setActiveGuides(activeGuidesList)
    }

    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, type, severity, status, tour_id, reported_by, created_at, description')
      .order('created_at', { ascending: false })
      .limit(20)

    if (incidentsData && incidentsData.length > 0) {
      // Get tour names and reporter names
      const tourIds = [...new Set(incidentsData.map((i: any) => i.tour_id).filter(Boolean))]
      const reporterIds = [...new Set(incidentsData.map((i: any) => i.reported_by).filter(Boolean))]
      
      const [{ data: toursInfo }, { data: reportersData }] = await Promise.all([
        supabase.from('tours').select('id, name').in('id', tourIds),
        supabase.from('profiles').select('id, first_name, last_name').in('id', reporterIds)
      ])
      
      const tourMap = new Map(toursInfo?.map((t: any) => [t.id, t.name]) || [])
      const reporterMap = new Map(reportersData?.map((g: any) => [g.id, g]) || [])

      const formattedIncidents = incidentsData.map((i: any) => {
        const reporter = reporterMap.get(i.reported_by)
        return {
          ...i,
          tour_name: tourMap.get(i.tour_id) || 'Unknown',
          guide_name: reporter ? `${reporter.first_name} ${reporter.last_name}` : 'Unknown'
        }
      }) as IncidentWithDetails[]
      
      setIncidents(formattedIncidents)
      
      const openCount = formattedIncidents.filter(i => 
        ['reported', 'acknowledged', 'in_progress'].includes(i.status)
      ).length
      
      setStats(prev => ({ ...prev, open_incidents: openCount }))

      const newAlerts: string[] = []
      if (openCount > 0) newAlerts.push(`${openCount} open incidents require attention`)
      if (stats.pending_checkins > 3) newAlerts.push(`${stats.pending_checkins} tours awaiting guide check-in`)
      setAlerts(newAlerts)
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
    <div className="h-full flex flex-col space-y-4 w-full overflow-hidden">
      {/* Header - Fixed height */}
      <div className="shrink-0">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium">Total Tours</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_tours}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-blue-600 uppercase font-medium">Total Guests</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_guests}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-green-600 uppercase font-medium">In Progress</p>
            <p className="text-2xl font-bold text-green-600">{stats.in_progress}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-red-600 uppercase font-medium">Open Incidents</p>
            <p className="text-2xl font-bold text-red-600">{stats.open_incidents}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Fills remaining space */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Row 1: Today's Tours + Live Map */}
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

        {/* Row 2: Incident Reports + Widgets Column */}
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
                        {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{incident.tour_name}</td>
                      <td className="px-3 py-2">{getSeverityBadge(incident.severity)}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{incident.type}</td>
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

          {/* Widgets Column */}
          <div className="flex flex-col gap-4">
            {/* Active Guides Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900 text-sm">Active Guides</h2>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{activeGuides.length} on tour</span>
              </div>
              <div className="space-y-2">
                {activeGuides.map((guide) => (
                  <div key={guide.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{guide.name}</p>
                        <p className="text-xs text-gray-500 truncate">{guide.tour}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{guide.lastCheckIn}</span>
                  </div>
                ))}
                {activeGuides.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No guides on tour</p>
                )}
              </div>
            </div>

            {/* Alerts Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1 overflow-hidden">
              <h2 className="font-semibold text-gray-900 text-sm mb-2">Alerts</h2>
              <div className="space-y-1">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-orange-500">⚠️</span>
                    <span className="text-gray-700 text-xs">{alert}</span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No active alerts</p>
                )}
              </div>
            </div>

            {/* Weather Widget - 3x2 Grid, no scroll */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1 overflow-hidden">
              <h2 className="font-semibold text-gray-900 text-sm mb-2">Weather Conditions</h2>
              <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[calc(100%-28px)]">
                {[
                  { loc: 'Isla Mujeres', temp: 29, icon: '☀️' },
                  { loc: 'Puerto Morelos', temp: 28, icon: '⛅' },
                  { loc: 'Playa del Carmen', temp: 30, icon: '☀️' },
                  { loc: 'Tulum', temp: 31, icon: '☀️' },
                  { loc: 'Coba', temp: 32, icon: '🌤️' },
                  { loc: 'Chichen Itza', temp: 33, icon: '☀️' },
                ].map((w) => (
                  <div key={w.loc} className="flex flex-col items-center justify-center bg-gray-50 rounded">
                    <span className="text-lg">{w.icon}</span>
                    <p className="text-[10px] font-medium text-gray-900 text-center leading-tight">{w.loc}</p>
                    <p className="text-xs font-bold text-gray-700">{w.temp}°</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Summary Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shrink-0">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-gray-500 text-xs">Expected Guests</p><p className="text-xl font-bold text-blue-600">{stats.total_guests}</p></div>
          <div><p className="text-gray-500 text-xs">No Shows</p><p className="text-xl font-bold text-red-600">{stats.no_shows}</p></div>
          <div><p className="text-gray-500 text-xs">Pending Check-In</p><p className="text-xl font-bold text-yellow-600">{stats.pending_checkins}</p></div>
        </div>
      </div>
    </div>
  )
}
