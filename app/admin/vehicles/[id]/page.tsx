'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params.id as string
  
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadVehicle()
  }, [vehicleId])

  async function loadVehicle() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (data) {
      setVehicle(data)
    }
    setLoading(false)
  }

  async function handleUpdate(updates: any) {
    setSaving(true)
    await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
    
    setVehicle({ ...vehicle, ...updates })
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    
    await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
    
    router.push('/admin/vehicles')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!vehicle) {
    return <div>Vehicle not found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/vehicles" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Vehicles
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{vehicle.plate_number}</h1>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
            <input
              type="text"
              value={vehicle.plate_number}
              onChange={(e) => handleUpdate({ plate_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {saving && <span className="text-xs text-gray-500">Saving...</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={vehicle.status}
              onChange={(e) => handleUpdate({ status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input
              type="text"
              value={vehicle.make || ''}
              onChange={(e) => handleUpdate({ make: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={vehicle.model || ''}
              onChange={(e) => handleUpdate({ model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={vehicle.year || ''}
              onChange={(e) => handleUpdate({ year: parseInt(e.target.value) || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={vehicle.capacity || ''}
              onChange={(e) => handleUpdate({ capacity: parseInt(e.target.value) || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
            <input
              type="text"
              value={vehicle.vin || ''}
              onChange={(e) => handleUpdate({ vin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
            <input
              type="date"
              value={vehicle.insurance_expiry || ''}
              onChange={(e) => handleUpdate({ insurance_expiry: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={vehicle.notes || ''}
            onChange={(e) => handleUpdate({ notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Maintenance notes, issues, etc."
          />
        </div>
      </div>
    </div>
  )
}
