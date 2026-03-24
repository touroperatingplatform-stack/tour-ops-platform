'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Incident {
  id: string
  type: string
  severity: string
  title: string
  description: string
  status: string
  location: string | null
  action_taken: string | null
  tour_id: string | null
  created_at: string
  resolved_at: string | null
  reporter: { first_name: string; last_name: string } | null
}

const typeIcons: Record<string, string> = {
  medical: '🏥',
  accident: '💥',
  vehicle: '🚐',
  guest: '😤',
  weather: '⛈️',
  other: '📝',
}

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default function IncidentDetailPage() {
  const params = useParams()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadIncident()
  }, [])

  async function loadIncident() {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, reporter:profiles!reported_by(first_name, last_name)')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading incident:', error)
    } else {
      setIncident(data)
    }
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const updates: any = { status: newStatus }
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolution_notes = resolution
    }

    const { error } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', params.id)

    if (error) {
      alert('Failed to update status')
    } else {
      setIncident(prev => prev ? { ...prev, status: newStatus } : null)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incident...</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident not found</h1>
        <Link href="/supervisor/incidents" className="text-blue-600 hover:underline">
          ← Back to incidents
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/supervisor/incidents" className="text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
          <p className="text-gray-500 text-sm">
            {new Date(incident.created_at).toLocaleDateString()} • Reported by {incident.reporter?.first_name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Status & Severity */}
      <div className="flex gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors[incident.severity] || 'bg-gray-100'}`}>
          {incident.severity}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          incident.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
          incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
          'bg-red-100 text-red-700'
        }`}>
          {incident.status}
        </span>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{typeIcons[incident.type] || '📝'}</span>
          <h2 className="font-semibold text-gray-900">Incident Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Type</h3>
            <p className="text-gray-900 capitalize">{incident.type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="text-gray-900">{incident.location || 'Not specified'}</p>
          </div>
          {incident.tour_id && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tour ID</h3>
              <p className="text-gray-900">{incident.tour_id}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reported</h3>
            <p className="text-gray-900">{new Date(incident.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{incident.description}</p>
        </div>
        {incident.action_taken && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Initial Action</h3>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{incident.action_taken}</p>
          </div>
        )}
      </div>

      {/* Resolution */}
      {incident.status === 'open' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resolve Incident</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how this incident was resolved..."
              />
            </div>
            <button
              onClick={() => updateStatus('resolved')}
              disabled={updating}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Mark as Resolved
            </button>
          </div>
        </div>
      )}

      {incident.status === 'resolved' && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <h2 className="font-semibold text-green-900 mb-2">Resolved</h2>
          <p className="text-green-700 text-sm">
            Resolved on {incident.resolved_at ? new Date(incident.resolved_at).toLocaleDateString() : 'Unknown date'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {incident.status === 'open' && (
          <button
            onClick={() => updateStatus('escalated')}
            disabled={updating}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Escalate
          </button>
        )}
        {incident.status === 'resolved' && (
          <button
            onClick={() => updateStatus('open')}
            disabled={updating}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  )
}
