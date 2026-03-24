'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Incident {
  id: string
  type: string
  severity: string
  description: string
  status: string
  tour_id: string | null
  reported_by: string | null
  created_at: string
  reporter: { first_name: string; last_name: string } | null
}

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const typeIcons: Record<string, string> = {
  medical: '🏥',
  accident: '💥',
  vehicle: '🚐',
  guest: '😤',
  weather: '⛈️',
  other: '📝',
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    let query = supabase
      .from('incidents')
      .select('*, reporter:profiles!reported_by(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (filter === 'open') {
      query = query.eq('status', 'open')
    } else if (filter === 'resolved') {
      query = query.eq('status', 'resolved')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading incidents:', error)
    } else {
      setIncidents(data || [])
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('incidents')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert('Failed to update status')
    } else {
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incidents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-500 mt-1">Track and manage reported issues</p>
        </div>
        <Link
          href="/supervisor/incidents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Incident
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'open'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Open ({incidents.filter(i => i.status === 'open').length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'resolved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolved ({incidents.filter(i => i.status === 'resolved').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({incidents.length})
        </button>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No incidents found</p>
            <p className="text-sm">No {filter} incidents at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidents.map((incident) => (
              <div key={incident.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[incident.type] || '📝'}</span>
                    <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    severityColors[incident.severity] || 'bg-gray-100'
                  }`}>
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Reported by: {incident.reporter?.first_name || 'Unknown'}</span>
                  <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                  {incident.location && <span>• {incident.location}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  {incident.status === 'open' && (
                    <button
                      onClick={() => updateStatus(incident.id, 'resolved')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {incident.status === 'resolved' && (
                    <button
                      onClick={() => updateStatus(incident.id, 'open')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Reopen
                    </button>
                  )}
                  <Link
                    href={`/supervisor/incidents/${incident.id}`}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
