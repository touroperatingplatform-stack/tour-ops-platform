'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Incident {
  id: string
  type: string
  severity: string
  title: string
  status: string
  created_at: string
  tour_id: string | null
}

const typeIcons: Record<string, string> = {
  medical: '🏥',
  accident: '💥',
  vehicle: '🚐',
  guest: '😤',
  weather: '⛈️',
  other: '📝',
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
}

export default function GuideIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    let query = supabase
      .from('incidents')
      .select('*')
      .eq('reported_by', userId)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading incidents:', error)
    } else {
      setIncidents(data || [])
    }
    setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1">View incidents you've reported</p>
        </div>
        <Link
          href="/guide/incidents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Report
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
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
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No incidents reported</p>
            <p className="text-sm">Tap + New Report to create your first incident.</p>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status] || 'bg-gray-100'}`}>
                    {incident.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                  {incident.tour_id && <span>• Tour: {incident.tour_id}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
