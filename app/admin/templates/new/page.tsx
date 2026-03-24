'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 120,
    capacity: 20,
    pickup_location: '',
    dropoff_location: '',
    default_guide_id: '',
    default_vehicle_id: '',
    checklist_template_id: '',
    brand_id: '',
    price: '',
  })

  useEffect(() => {
    loadOptions()
  }, [])

  async function loadOptions() {
    const [{ data: g }, { data: v }, { data: c }, { data: b }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'guide'),
      supabase.from('vehicles').select('id, plate_number, make, model').eq('status', 'available'),
      supabase.from('checklists').select('id, name'),
      supabase.from('brands').select('id, name'),
    ])

    setGuides(g || [])
    setVehicles(v || [])
    setChecklists(c || [])
    setBrands(b || [])
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
      .from('tour_templates')
      .insert({
        company_id: profile.company_id,
        name: formData.name,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        capacity: formData.capacity,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        default_guide_id: formData.default_guide_id || null,
        default_vehicle_id: formData.default_vehicle_id || null,
        checklist_template_id: formData.checklist_template_id || null,
        brand_id: formData.brand_id || null,
        price: formData.price ? parseFloat(formData.price) : null,
        created_by: session?.user?.id,
      })

    setSaving(false)

    if (!error) {
      router.push('/admin/templates')
    } else {
      alert('Failed to create template: ' + error.message)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">New Tour Template</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Chichen Itza Day Tour"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
            <input
              type="number"
              name="duration_minutes"
              required
              min="30"
              step="15"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
            <input
              type="number"
              name="capacity"
              required
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
          <input
            type="text"
            name="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
          <input
            type="text"
            name="dropoff_location"
            value={formData.dropoff_location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Guide</label>
          <select
            name="default_guide_id"
            value={formData.default_guide_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">None (assign later)</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.first_name} {g.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Vehicle</label>
          <select
            name="default_vehicle_id"
            value={formData.default_vehicle_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">None (assign later)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} - {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Template</label>
          <select
            name="checklist_template_id"
            value={formData.checklist_template_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">None</option>
            {checklists.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select
            name="brand_id"
            value={formData.brand_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">None</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
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
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  )
}
