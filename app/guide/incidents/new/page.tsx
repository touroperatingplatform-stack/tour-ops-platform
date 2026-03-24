'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

const incidentTypes = [
  { value: 'medical', label: 'Medical Emergency', icon: '🏥' },
  { value: 'accident', label: 'Accident', icon: '💥' },
  { value: 'vehicle', label: 'Vehicle Issue', icon: '🚐' },
  { value: 'guest', label: 'Guest Complaint', icon: '😤' },
  { value: 'weather', label: 'Weather', icon: '⛈️' },
  { value: 'other', label: 'Other', icon: '📝' },
]

const severities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
]

export default function NewIncidentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'other',
    severity: 'medium',
    tour_id: '',
    title: '',
    description: '',
    location: '',
    action_taken: '',
  })

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          type: formData.type,
          severity: formData.severity,
          tour_id: formData.tour_id || null,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          action_taken: formData.action_taken,
          reported_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'open',
        })

      if (error) throw error

      router.push('/guide/incidents')
    } catch (err: any) {
      alert(err.message || 'Failed to report incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/guide" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report Incident</h1>
        <p className="text-gray-500 mt-1">Document any issues or emergencies</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {/* Incident Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {incidentTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`px-4 py-3 rounded-lg border-2 text-center transition-all ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">{type.icon}</span>
                <p className="text-sm font-medium text-gray-900">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
          <div className="grid grid-cols-4 gap-2">
            {severities.map((sev) => (
              <button
                key={sev.value}
                type="button"
                onClick={() => handleChange('severity', sev.value)}
                className={`px-3 py-2 rounded-lg border-2 text-center transition-all ${
                  formData.severity === sev.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium">{sev.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief summary"
          />
        </div>

        {/* Tour ID (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Related Tour ID</label>
          <input
            type="text"
            value={formData.tour_id}
            onChange={(e) => handleChange('tour_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave blank if not tour-related"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what happened..."
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Where did it occur?"
          />
        </div>

        {/* Action Taken */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
          <textarea
            value={formData.action_taken}
            onChange={(e) => handleChange('action_taken', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What steps were taken to address the incident?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/guide"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Reporting...' : 'Report Incident'}
          </button>
        </div>
      </form>
    </div>
  )
}
