'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  reported: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const typeIcons: Record<string, string> = {
  vehicle_breakdown: '🚗',
  guest_injury: '🤕',
  delay: '⏰',
  no_show: '👻',
  guide_issue: '👤',
  weather: '🌧️',
  other: '📋',
}

export default function SupervisorIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadIncidents()
    const interval = setInterval(loadIncidents, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadIncidents() {
    let query = supabase
      .from('incidents')
      .select(`
        *,
        tour:tours(id, name, tour_date),
        reporter:profiles!reported_by(first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setIncidents(data)
    setLoading(false)
  }

  async function updateStatus(incidentId: string, newStatus: string) {
    const { data: { session } } = await supabase.auth.getSession()
    
    await supabase
      .from('incidents')
      .update({
        status: newStatus,
        resolved_by: newStatus === 'resolved' ? session?.user?.id : null,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', incidentId)

    loadIncidents()
  }

  const openIncidents = incidents.filter(i => i.status === 'reported' || i.status === 'in_progress')
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{openIncidents.length}</p>
          <p className="text-red-100 text-sm">Open</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{resolvedIncidents.length}</p>
          <p className="text-green-100 text-sm">Resolved</p>
        </div>
      </div>

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value)
          loadIncidents()
        }}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white"
      >
        <option value="all">All Status</option>
        <option value="reported">Reported</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-gray-500">No incidents reported</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcons[incident.type] || '📋'}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{incident.tour?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(incident.created_at).toLocaleString()} • {incident.reporter?.first_name} {incident.reporter?.last_name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity]}`}>
                    {incident.severity}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">{incident.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                    {incident.status}
                  </span>

                  <div className="flex gap-2">
                    {incident.status === 'reported' && (
                      <button
                        onClick={() => updateStatus(incident.id, 'in_progress')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
                      >
                        Start
                      </button>
                    )}
                    {(incident.status === 'reported' || incident.status === 'in_progress') && (
                      <button
                        onClick={() => updateStatus(incident.id, 'resolved')}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
