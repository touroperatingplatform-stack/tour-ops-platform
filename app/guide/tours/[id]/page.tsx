'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  pickup_location: string
  guide: { first_name: string; last_name: string } | null
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

const defaultChecklist: ChecklistItem[] = [
  { id: 'vehicle', label: 'Vehicle inspected & clean', checked: false },
  { id: 'supplies', label: 'Water/snacks stocked', checked: false },
  { id: 'first_aid', label: 'First aid kit present', checked: false },
  { id: 'passengers', label: 'All passengers boarded', checked: false },
  { id: 'safety_brief', label: 'Safety briefing completed', checked: false },
]

export default function GuideTourPage() {
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [equipmentPhoto, setEquipmentPhoto] = useState<string | null>(null)
  const [vanPhoto, setVanPhoto] = useState<string | null>(null)

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id, equipment_photo_url, van_photo_url')
      .eq('id', params.id)
      .single()

    if (tourData && tourData.guide_id) {
      const { data: guide } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', tourData.guide_id)
        .single()
      setTour({ ...tourData, guide })
      if (tourData.equipment_photo_url) setEquipmentPhoto(tourData.equipment_photo_url)
      if (tourData.van_photo_url) setVanPhoto(tourData.van_photo_url)
    } else {
      setTour(tourData as any)
    }
    setLoading(false)
  }

  function toggleChecklist(id: string) {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  async function handlePhotoUpload(type: 'equipment' | 'van', file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      if (type === 'equipment') {
        setEquipmentPhoto(url)
      } else {
        setVanPhoto(url)
      }
      // Save to tour record
      await supabase
        .from('tours')
        .update({ [type === 'equipment' ? 'equipment_photo_url' : 'van_photo_url']: url })
        .eq('id', params.id)
    } catch (err) {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function startTour() {
    const allChecked = checklist.every(i => i.checked)
    if (!allChecked) {
      alert('Please complete all checklist items before starting')
      return
    }

    const { error } = await supabase
      .from('tours')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      alert('Failed to start tour')
    } else {
      setTour(prev => prev ? { ...prev, status: 'in_progress' } : null)
    }
  }

  async function completeTour() {
    router.push(`/guide/tours/${params.id}/complete`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tour...</div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tour not found</h1>
        <Link href="/guide" className="text-blue-600 hover:underline">
          ← Back to my tours
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
        <p className="text-gray-500 mt-1">{tour.start_time?.slice(0, 5)} • {tour.pickup_location}</p>
      </div>

      {/* Status */}
      <div className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${
        tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
        tour.status === 'completed' ? 'bg-green-100 text-green-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {tour.status.replace('_', ' ')}
      </div>

      {/* Pre-Trip Checklist */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Pre-Trip Checklist</h2>
        <div className="space-y-3">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleChecklist(item.id)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo Uploads - Only show when starting or in progress */}
      {(tour.status === 'scheduled' || tour.status === 'in_progress') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Required Photos</h2>
          
          {/* Equipment Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Check Photo</label>
            {equipmentPhoto ? (
              <div className="relative">
                <img src={equipmentPhoto} alt="Equipment" className="w-full h-48 object-cover rounded-lg" />
                <button 
                  onClick={() => setEquipmentPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  Retake
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">Tap to take photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload('equipment', e.target.files[0])}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Van Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photo</label>
            {vanPhoto ? (
              <div className="relative">
                <img src={vanPhoto} alt="Van" className="w-full h-48 object-cover rounded-lg" />
                <button 
                  onClick={() => setVanPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  Retake
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <span className="text-3xl mb-2">🚐</span>
                <span className="text-sm text-gray-500">Tap to take photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload('van', e.target.files[0])}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tour Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this tour..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {tour.status === 'scheduled' && (
          <button
            onClick={startTour}
            disabled={uploading || !equipmentPhoto || !vanPhoto}
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {uploading ? 'Uploading...' : 'Start Tour'}
          </button>
        )}
        {tour.status === 'in_progress' && (
          <button
            onClick={completeTour}
            className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            Complete Tour
          </button>
        )}
        {['completed', 'cancelled'].includes(tour.status) && (
          <div className="flex-1 text-center text-gray-500 py-4">
            Tour {tour.status}
          </div>
        )}
      </div>

      <Link
        href="/guide"
        className="block text-center text-gray-600 hover:text-gray-900 text-sm py-4"
      >
        ← Back to My Tours
      </Link>
    </div>
  )
}
