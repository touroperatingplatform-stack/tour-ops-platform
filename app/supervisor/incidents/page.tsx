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
    
    // Poll every 30 seconds for new incidents
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

    if (data) {
      setIncidents(data)
    }
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
      <div className="p-4">
        <p className="text-center text-gray-500">Loading incidents...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Incidents</h1>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            loadIncidents()
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="reported">Reported</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-red-700">{openIncidents.length}</p>
          <p className="text-sm text-red-600">Open</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-green-700">{resolvedIncidents.length}</p>
          <p className="text-sm text-green-600">Resolved</p>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No incidents reported</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{incident.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[incident.status]}`}>
                    {incident.status}
                  </span>

                  <div className="flex gap-2">
                    {incident.status === 'reported' && (
                      <button
                        onClick={() => updateStatus(incident.id, 'in_progress')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                      >
                        Start
                      </button>
                    )}
                    {(incident.status === 'reported' || incident.status === 'in_progress') && (
                      <button
                        onClick={() => updateStatus(incident.id, 'resolved')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg"
                      >
                        Resolve
                      </button>
                    )}
                    {incident.status === 'resolved' && (
                      <button
                        onClick={() => updateStatus(incident.id, 'closed')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg"
                      >
                        Close
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
