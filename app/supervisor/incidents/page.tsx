'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface IncidentWithDetails {
  id: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: string
  reported_at: string
  photo_urls: string[]
  tour: {
    name: string
    tour_date: string
  }
  guide: {
    first_name: string
    last_name: string
  }
}

const incidentTypeLabels: Record<string, string> = {
  medical_emergency: '🏥 Medical Emergency',
  vehicle_breakdown: '🚐 Vehicle Breakdown',
  vehicle_accident: '💥 Vehicle Accident',
  guest_injury: '🤕 Guest Injury',
  guest_complaint: '😤 Guest Complaint',
  guest_dispute: '🗣️ Guest Dispute',
  weather_delay: '🌧️ Weather Delay',
  traffic_delay: '🚦 Traffic Delay',
  lost_item: '🔑 Lost Item',
  theft: '⚠️ Theft',
  other: '📝 Other',
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default function SupervisorIncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    const { data } = await supabase
      .from('incidents')
      .select(`
        id, incident_type, severity, title, description, status, reported_at, photo_urls,
        tour:tour_id (name, tour_date),
        guide:guide_id (first_name, last_name)
      `)
      .order('reported_at', { ascending: false })

    if (data) setIncidents(data as IncidentWithDetails[])
    setLoading(false)
  }

  async function acknowledgeIncident(incidentId: string) {
    setProcessing(incidentId)
    await supabase
      .from('incidents')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', incidentId)
    await loadIncidents()
    setProcessing(null)
  }

  async function resolveIncident(incidentId: string) {
    setProcessing(incidentId)
    await supabase
      .from('incidents')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', incidentId)
    await loadIncidents()
    setProcessing(null)
  }

  const openIncidents = incidents.filter(i => i.status === 'reported')
  const acknowledgedIncidents = incidents.filter(i => i.status === 'acknowledged' || i.status === 'in_progress')
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/supervisor" className="text-blue-600 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage tour incidents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">New Reports</p>
            <p className="text-2xl font-bold text-red-600">{openIncidents.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{acknowledgedIncidents.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{resolvedIncidents.length}</p>
          </div>
        </div>

        {/* New/Critical Incidents */}
        {openIncidents.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              New Reports ({openIncidents.length})
            </h2>
            <div className="space-y-4">
              {openIncidents.map(incident => (
                <div key={incident.id} className={`bg-white rounded-2xl border-2 p-5 ${
                  incident.severity === 'critical' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{incidentTypeLabels[incident.incident_type]}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{incident.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {incident.tour.name} • {new Date(incident.tour.tour_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        👤 {incident.guide.first_name} {incident.guide.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors[incident.severity]}`}>
                        {incident.severity}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(incident.reported_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4 bg-white p-3 rounded-lg">
                    {incident.description}
                  </p>
                  
                  {incident.photo_urls && incident.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {incident.photo_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Incident ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => acknowledgeIncident(incident.id)}
                      disabled={processing === incident.id}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {processing === incident.id ? 'Processing...' : '👁️ Acknowledge'}
                    </button>
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      disabled={processing === incident.id}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      ✓ Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {openIncidents.length === 0 && acknowledgedIncidents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">✅ No open incidents!</p>
          </div>
        )}
      </div>
    </div>
  )
}
