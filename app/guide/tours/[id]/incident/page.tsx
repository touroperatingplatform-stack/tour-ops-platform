'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

const incidentTypes = [
  { value: 'medical_emergency', label: '🏥 Medical Emergency', icon: '🏥', description: 'Guest requires medical attention' },
  { value: 'vehicle_breakdown', label: '🚐 Vehicle Breakdown', icon: '🚐', description: 'Vehicle mechanical issue' },
  { value: 'vehicle_accident', label: '💥 Vehicle Accident', icon: '💥', description: 'Accident involving vehicle' },
  { value: 'guest_injury', label: '🤕 Guest Injury', icon: '🤕', description: 'Guest injured (non-medical emergency)' },
  { value: 'guest_complaint', label: '😤 Guest Complaint', icon: '😤', description: 'Service complaint from guest' },
  { value: 'guest_dispute', label: '🗣️ Guest Dispute', icon: '🗣️', description: 'Conflict between guests' },
  { value: 'weather_delay', label: '🌧️ Weather Delay', icon: '🌧️', description: 'Tour delayed due to weather' },
  { value: 'traffic_delay', label: '🚦 Traffic Delay', icon: '🚦', description: 'Significant traffic delay' },
  { value: 'lost_item', label: '🔑 Lost Item', icon: '🔑', description: 'Guest lost personal item' },
  { value: 'theft', label: '⚠️ Theft', icon: '⚠️', description: 'Theft or security incident' },
  { value: 'other', label: '📝 Other', icon: '📝', description: 'Other incident type' },
]

const severityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700', description: 'Minor issue, easily resolved' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700', description: 'Needs attention but not urgent' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700', description: 'Serious issue, supervisor notified' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700', description: 'Emergency, immediate supervisor alert' },
]

export default function ReportIncidentPage() {
  const params = useParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [incidentType, setIncidentType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationNotes, setLocationNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [guestsInvolved, setGuestsInvolved] = useState('')

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      if (url) {
        setPhotos(prev => [...prev, url as string])
      }
    } catch (err) {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!incidentType || !title || !description) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    // Get current location
    let latitude = null
    let longitude = null
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      latitude = position.coords.latitude
      longitude = position.coords.longitude
    } catch {
      // Location optional - guide can add notes
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('incidents')
      .insert({
        tour_id: params.id,
        guide_id: user?.id,
        incident_type: incidentType,
        severity: severity,
        title: title,
        description: description,
        location_notes: locationNotes,
        latitude: latitude,
        longitude: longitude,
        photo_urls: photos,
        guest_names: guestsInvolved,
        status: 'reported',
      })

    if (error) {
      alert('Failed to report incident: ' + error.message)
    } else {
      const severityLabel = severityOptions.find(s => s.value === severity)?.label
      if (severity === 'high' || severity === 'critical') {
        alert(`⚠️ ${severityLabel} incident reported!\n\nSupervisor has been notified and will respond shortly.`)
      } else {
        alert(`✅ Incident reported successfully`)
      }
      router.push(`/guide/tours/${params.id}`)
    }
    setSubmitting(false)
  }

  const selectedType = incidentTypes.find(t => t.value === incidentType)
  const selectedSeverity = severityOptions.find(s => s.value === severity)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/guide/tours/${params.id}`} className="text-blue-600 text-sm mb-2 inline-block">
            ← Back to tour
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Report Incident</h1>
          <p className="text-gray-500 text-sm mt-1">Document any issues or emergencies</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of incident? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setIncidentType(type.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    incidentType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mr-2">{type.icon}</span>
                  <span className="text-sm font-medium block mt-1">{type.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            {selectedType && (
              <p className="text-sm text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg">
                {selectedType.description}
              </p>
            )}
          </div>

          {/* Severity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Severity Level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {severityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    severity === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${opt.color}`}>
                      {opt.label}
                    </span>
                    <span className="text-sm text-gray-600">{opt.description}</span>
                  </div>
                </button>
              ))}
            </div>
            {(severity === 'high' || severity === 'critical') && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-700">
                  ⚠️ {selectedSeverity?.label} severity - Supervisor will be notified immediately
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the incident"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Location Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <p className="text-xs text-gray-500 mb-2">GPS will be captured automatically</p>
            <input
              type="text"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              placeholder="e.g., Near Tulum entrance, km 5 marker"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Guests Involved */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guests Involved (optional)
            </label>
            <input
              type="text"
              value={guestsInvolved}
              onChange={(e) => setGuestsInvolved(e.target.value)}
              placeholder="Names of affected guests"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photos (optional)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img src={photo} alt={`Incident ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs text-gray-500 mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">{photos.length}/4 photos added</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploading || !incidentType || !title || !description}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
              severity === 'critical'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : severity === 'high'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:bg-gray-400`}
          >
            {submitting ? 'Reporting...' : severity === 'critical' ? '🚨 Report Critical Incident' : 'Report Incident'}
          </button>
        </form>
      </div>
      <div className="h-24"></div>
    </div>
  )
}
