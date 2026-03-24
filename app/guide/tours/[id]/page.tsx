'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

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
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, pickup_location, guide_id')
      .eq('id', params.id)
      .single()

    if (tourData && tourData.guide_id) {
      const { data: guide } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', tourData.guide_id)
        .single()
      setTour({ ...tourData, guide })
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

  async function startTour() {
    const allChecked = checklist.every(i => i.checked)
    if (!allChecked) {
      alert('Please complete all checklist items before starting')
      return
    }

    const { error } = await supabase
      .from('tours')
      .update({ status: 'in_progress' })
      .eq('id', params.id)

    if (error) {
      alert('Failed to start tour')
    } else {
      setTour(prev => prev ? { ...prev, status: 'in_progress' } : null)
    }
  }

  async function completeTour() {
    const { error } = await supabase
      .from('tours')
      .update({ status: 'completed' })
      .eq('id', params.id)

    if (error) {
      alert('Failed to complete tour')
    } else {
      setTour(prev => prev ? { ...prev, status: 'completed' } : null)
    }
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
    <div className="space-y-6">
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

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tour Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this tour..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {tour.status === 'scheduled' && (
          <button
            onClick={startTour}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Tour
          </button>
        )}
        {tour.status === 'in_progress' && (
          <button
            onClick={completeTour}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete Tour
          </button>
        )}
        {['completed', 'cancelled'].includes(tour.status) && (
          <div className="flex-1 text-center text-gray-500 py-3">
            Tour {tour.status}
          </div>
        )}
      </div>

      <Link
        href="/guide"
        className="block text-center text-gray-600 hover:text-gray-900 text-sm"
      >
        ← Back to My Tours
      </Link>
    </div>
  )
}
