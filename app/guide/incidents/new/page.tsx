'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { useTranslation } from '@/lib/i18n/useTranslation'

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

interface Tour {
  id: string
  name: string
  start_time: string
  tour_date: string
}

export default function NewIncidentPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [myTours, setMyTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    type: 'other',
    severity: 'medium',
    tour_id: '',
    description: '',
  })

  useEffect(() => {
    loadMyTours()
  }, [])

  async function loadMyTours() {
    const today = new Date().toISOString().split('T')[0]
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData.user) {
      setToursLoading(false)
      return
    }

    const { data } = await supabase
      .from('tours')
      .select('id, name, start_time, tour_date')
      .eq('guide_id', userData.user.id)
      .gte('tour_date', today)
      .order('tour_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10)

    if (data) setMyTours(data)
    setToursLoading(false)
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'tour-ops/incidents')
      if (url) {
        setPhotos(prev => [...prev, url])
      } else {
        alert('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await supabase.auth.getUser()
      const incidentData: any = {
        type: formData.type,
        severity: formData.severity,
        tour_id: formData.tour_id || null,
        description: formData.description,
        reported_by: user.data.user?.id,
        status: 'open',
      }

      // Add photo URLs if uploaded
      if (photos.length > 0) {
        incidentData.photo_urls = photos
      }

      const { error } = await supabase
        .from('incidents')
        .insert(incidentData)

      if (error) throw error

      router.push('/guide/incidents')
    } catch (err: any) {
      alert(err.message || 'Failed to report incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/guide" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('guideNewIncident.backToDashboard')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('guideNewIncident.reportIncident')}</h1>
        <p className="text-gray-500 mt-1">{t('guideNewIncident.documentIssues')}</p>
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

        {/* Related Tour - DROPDOWN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Related Tour</label>
          {toursLoading ? (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading your tours...
            </div>
          ) : myTours.length > 0 ? (
            <select
              value={formData.tour_id}
              onChange={(e) => handleChange('tour_id', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="">-- Select a tour --</option>
              {myTours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} - {new Date(tour.tour_date).toLocaleDateString()} {tour.start_time?.slice(0, 5)}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              No upcoming tours assigned to you
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Select the tour this incident relates to (optional)</p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={photo} alt={`Incident photo ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
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
          {uploading && <p className="text-sm text-blue-600 mt-2">⏳ Uploading...</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what happened..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/guide"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Reporting...' : 'Report Incident'}
          </button>
        </div>
      </form>
      {/* Extra bottom padding for mobile nav bar */}
      <div className="h-24"></div>
    </div>
  )
}
