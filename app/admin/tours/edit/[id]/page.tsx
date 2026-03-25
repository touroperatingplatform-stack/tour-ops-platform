'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function EditTourPage() {
  const router = useRouter()
  const params = useParams()
  const tourId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tour_date: '',
    start_time: '',
    end_time: '',
    pickup_location: '',
    dropoff_location: '',
    guide_id: '',
    vehicle_id: '',
    status: 'scheduled',
  })

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour
    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tour) {
      setFormData({
        name: tour.name || '',
        description: tour.description || '',
        tour_date: tour.tour_date || '',
        start_time: tour.start_time || '',
        end_time: tour.end_time || '',
        pickup_location: tour.pickup_location || '',
        dropoff_location: tour.dropoff_location || '',
        guide_id: tour.guide_id || '',
        vehicle_id: tour.vehicle_id || '',
        status: tour.status || 'scheduled',
      })
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

    setVehicles(vehiclesData || [])
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('tours')
      .update({
        name: formData.name,
        description: formData.description || null,
        tour_date: formData.tour_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        guide_id: formData.guide_id || null,
        vehicle_id: formData.vehicle_id || null,
        status: formData.status,
      })
      .eq('id', tourId)

    setSaving(false)
    
    if (!error) {
      router.push('/admin/tours')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/tours" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Tours
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Tour</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="tour_date"
                required
                value={formData.tour_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                name="start_time"
                required
                value={formData.start_time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
              <input
                type="text"
                name="dropoff_location"
                value={formData.dropoff_location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
              <select
                name="guide_id"
                value={formData.guide_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <Link
              href="/admin/tours"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
