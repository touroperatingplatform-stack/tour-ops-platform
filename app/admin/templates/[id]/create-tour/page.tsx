'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CreateFromTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<any>(null)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tour_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_minutes: 120,
    capacity: 20,
    pickup_location: '',
    dropoff_location: '',
    guide_id: '',
    vehicle_id: '',
    price: '',
  })

  useEffect(() => {
    loadData()
  }, [templateId])

  async function loadData() {
    // Load template
    const { data: tmpl } = await supabase
      .from('tour_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (tmpl) {
      setTemplate(tmpl)
      setFormData({
        name: tmpl.name,
        description: tmpl.description || '',
        tour_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        duration_minutes: tmpl.duration_minutes || 120,
        capacity: tmpl.capacity || 20,
        pickup_location: tmpl.pickup_location || '',
        dropoff_location: tmpl.dropoff_location || '',
        guide_id: tmpl.default_guide_id || '',
        vehicle_id: tmpl.default_vehicle_id || '',
        price: tmpl.price || '',
      })
    }

    // Load options
    const [{ data: g }, { data: v }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'guide'),
      supabase.from('vehicles').select('id, plate_number, make, model').eq('status', 'available'),
    ])

    setGuides(g || [])
    setVehicles(v || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session?.user?.id || '')
      .single()

    if (!profile?.company_id) {
      alert('Company not found')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('tours')
      .insert({
        company_id: profile.company_id,
        name: formData.name,
        description: formData.description || null,
        tour_date: formData.tour_date,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        capacity: formData.capacity,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        guide_id: formData.guide_id || null,
        vehicle_id: formData.vehicle_id || null,
        price: formData.price ? parseFloat(formData.price) : null,
        status: 'scheduled',
        created_by: session?.user?.id,
        template_id: templateId,
      })

    setSaving(false)

    if (!error) {
      router.push('/admin/tours')
    } else {
      alert('Failed to create tour: ' + error.message)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Tour from Template</h1>
      <p className="text-gray-500 mb-4">Using template: {template?.name}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={formData.tour_date}
              onChange={(e) => setFormData({ ...formData, tour_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
            <input
              type="number"
              required
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
            <input
              type="number"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
          <select
            value={formData.guide_id}
            onChange={(e) => setFormData({ ...formData, guide_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            value={formData.vehicle_id}
            onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Unassigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} - {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Tour'}
          </button>
        </div>
      </form>
    </div>
  )
}
