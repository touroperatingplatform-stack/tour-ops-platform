'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function TourDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tourId = params.id as string
  
  const [tour, setTour] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour
    const { data: tourData } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tourData) {
      setTour(tourData)
    }

    // Load guides
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'guide')
      .eq('is_active', true)

    setGuides(guidesData || [])

    // Load vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .eq('status', 'available')

    setVehicles(vehiclesData || [])
    setLoading(false)
  }

  async function handleUpdate(updates: any) {
    setSaving(true)
    await supabase
      .from('tours')
      .update(updates)
      .eq('id', tourId)
    
    setTour({ ...tour, ...updates })
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this tour?')) return
    
    await supabase
      .from('tours')
      .delete()
      .eq('id', tourId)
    
    router.push('/admin/tours')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!tour) {
    return <div>Tour not found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/tours" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Tours
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{tour.name}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleDelete()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tour Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={tour.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {saving && <span className="text-xs text-gray-500 ml-2">Saving...</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
              <select
                value={tour.guide_id || ''}
                onChange={(e) => handleUpdate({ guide_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.first_name} {g.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select
                value={tour.vehicle_id || ''}
                onChange={(e) => handleUpdate({ vehicle_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={tour.start_time}
                  onChange={(e) => handleUpdate({ start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={tour.end_time || ''}
                  onChange={(e) => handleUpdate({ end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                value={tour.pickup_location || ''}
                onChange={(e) => handleUpdate({ pickup_location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Hotel name or address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
              <input
                type="text"
                value={tour.dropoff_location || ''}
                onChange={(e) => handleUpdate({ dropoff_location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Hotel name or address"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <textarea
            value={tour.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tour description..."
          />
        </div>
      </div>
    </div>
  )
}
