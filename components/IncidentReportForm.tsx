'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { createNotification } from '@/lib/notifications'

const incidentTypes = [
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown', icon: '🚗' },
  { value: 'guest_injury', label: 'Guest Injury', icon: '🤕' },
  { value: 'delay', label: 'Tour Delay', icon: '⏰' },
  { value: 'no_show', label: 'Guest No-Show', icon: '👻' },
  { value: 'guide_issue', label: 'Guide Issue', icon: '👤' },
  { value: 'weather', label: 'Weather Issue', icon: '🌧️' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const severities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
]

interface IncidentReportFormProps {
  tourId: string
  tourName: string
  onClose: () => void
  onSuccess: () => void
}

export default function IncidentReportForm({ tourId, tourName, onClose, onSuccess }: IncidentReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    severity: 'medium',
    description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }

    // Get GPS location if available
    let gpsLocation = null
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        gpsLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      } catch {
        // GPS failed, continue without it
      }
    }

    // Create incident
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        tour_id: tourId,
        reported_by: session.user.id,
        type: formData.type,
        severity: formData.severity,
        description: formData.description,
        status: 'reported',
        gps_location: gpsLocation,
      })
      .select()
      .single()

    if (error) {
      alert('Failed to report incident: ' + error.message)
      setLoading(false)
      return
    }

    // Get guide name for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', session.user.id)
      .single()

    const guideName = profile ? `${profile.first_name} ${profile.last_name}` : 'A guide'

    // Notify supervisors
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['supervisor', 'manager', 'company_admin'])
      .eq('is_active', true)

    if (supervisors) {
      for (const supervisor of supervisors) {
        await createNotification({
          userId: supervisor.id,
          type: 'incident',
          title: `🚨 Incident: ${tourName}`,
          message: `${guideName} reported: ${incidentTypes.find(t => t.value === formData.type)?.label}`,
          data: { incident_id: incident.id, tour_id: tourId },
        })
      }
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Report Incident</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tour</label>
            <p className="text-gray-900 font-medium">{tourName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
            <div className="flex gap-2">
              {severities.map((sev) => (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: sev.value })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.severity === sev.value
                      ? sev.color + ' ring-2 ring-offset-1 ring-gray-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what happened..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.type || !formData.description}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
