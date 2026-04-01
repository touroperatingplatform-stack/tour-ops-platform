'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type StopType = 'pickup' | 'activity' | 'dropoff'

interface Stop {
  id: string
  tour_id: string
  sort_order: number
  location_name: string
  address: string
  latitude: number | null
  longitude: number | null
  scheduled_time: string
  guest_count: number | null
  stop_type: StopType
  notes: string | null
}

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
}

export default function ManageStopsPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [tour, setTour] = useState<Tour | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    location_name: '',
    address: '',
    scheduled_time: '',
    guest_count: '',
    stop_type: 'pickup' as StopType,
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, tour_date, start_time')
      .eq('id', tourId)
      .single()

    if (tourData) setTour(tourData)

    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('*')
      .eq('tour_id', tourId)
      .order('sort_order')

    if (stopsData) setStops(stopsData)
    setLoading(false)
  }

  function resetForm() {
    setForm({
      location_name: '',
      address: '',
      scheduled_time: '',
      guest_count: '',
      stop_type: 'pickup',
      notes: ''
    })
    setEditingId(null)
  }

  function editStop(stop: Stop) {
    setForm({
      location_name: stop.location_name,
      address: stop.address || '',
      scheduled_time: stop.scheduled_time?.slice(0, 5) || '',
      guest_count: stop.guest_count?.toString() || '',
      stop_type: stop.stop_type,
      notes: stop.notes || ''
    })
    setEditingId(stop.id)
  }

  async function handleSave() {
    if (!form.location_name || !form.scheduled_time) {
      alert('Please fill in location name and scheduled time')
      return
    }

    setSaving(true)

    try {
      const sortOrder = editingId
        ? stops.find(s => s.id === editingId)?.sort_order ?? 1
        : (stops.length + 1)

      const stopData = {
        tour_id: tourId,
        sort_order: sortOrder,
        location_name: form.location_name,
        address: form.address || null,
        scheduled_time: form.scheduled_time + ':00',
        guest_count: form.guest_count ? parseInt(form.guest_count) : null,
        stop_type: form.stop_type,
        notes: form.notes || null
      }

      if (editingId) {
        const { error } = await supabase
          .from('pickup_stops')
          .update(stopData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pickup_stops')
          .insert(stopData)

        if (error) throw error
      }

      await loadData()
      resetForm()
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this stop?')) return

    const { error } = await supabase
      .from('pickup_stops')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete')
    } else {
      setStops(prev => prev.filter(s => s.id !== id))
    }
  }

  async function moveStop(id: string, direction: 'up' | 'down') {
    const idx = stops.findIndex(s => s.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === stops.length - 1) return

    const swapWith = direction === 'up' ? stops[idx - 1] : stops[idx + 1]
    const current = stops[idx]

    // Swap sort_order
    await supabase
      .from('pickup_stops')
      .update({ sort_order: swapWith.sort_order })
      .eq('id', current.id)

    await supabase
      .from('pickup_stops')
      .update({ sort_order: current.sort_order })
      .eq('id', swapWith.id)

    await loadData()
  }

  const typeColors: Record<StopType, string> = {
    pickup: 'bg-blue-100 text-blue-700 border-blue-200',
    activity: 'bg-green-100 text-green-700 border-green-200',
    dropoff: 'bg-purple-100 text-purple-700 border-purple-200'
  }

  const typeIcons: Record<StopType, string> = {
    pickup: '📍',
    activity: '🎯',
    dropoff: '🏁'
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/tours" className="text-blue-600 text-sm hover:underline">
          ← Back to Tours
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Manage Stops</h1>
        {tour && (
          <p className="text-gray-500">
            {tour.name} • {new Date(tour.tour_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {editingId ? 'Edit Stop' : 'Add New Stop'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stop Type</label>
            <select
              value={form.stop_type}
              onChange={(e) => setForm(prev => ({ ...prev, stop_type: e.target.value as StopType }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pickup">📍 Pickup</option>
              <option value="activity">🎯 Activity</option>
              <option value="dropoff">🏁 Dropoff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time *</label>
            <input
              type="time"
              value={form.scheduled_time}
              onChange={(e) => setForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
            <input
              type="text"
              value={form.location_name}
              onChange={(e) => setForm(prev => ({ ...prev, location_name: e.target.value }))}
              placeholder="e.g., Grand Sunset Resort"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
            <input
              type="number"
              value={form.guest_count}
              onChange={(e) => setForm(prev => ({ ...prev, guest_count: e.target.value }))}
              placeholder="Number of guests (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : editingId ? 'Update Stop' : 'Add Stop'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stops List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h2 className="font-semibold text-gray-900 p-6 pb-4">Stops ({stops.length})</h2>

        {stops.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No stops added yet. Add pickups, activities, and dropoffs.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stops.map((stop, idx) => (
              <div key={stop.id} className={`p-4 flex items-center gap-4 ${typeColors[stop.stop_type]}`}>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStop(stop.id, 'up')}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStop(stop.id, 'down')}
                    disabled={idx === stops.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[stop.stop_type]}</span>
                    <span className="font-medium">{stop.location_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                      {stop.stop_type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stop.scheduled_time?.slice(0, 5)}
                    {stop.guest_count && ` • ${stop.guest_count} guests`}
                    {stop.address && ` • ${stop.address}`}
                  </div>
                  {stop.notes && (
                    <div className="text-xs text-gray-500 mt-1">{stop.notes}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editStop(stop)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(stop.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}