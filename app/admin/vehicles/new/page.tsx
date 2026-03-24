'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function NewVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 10,
    status: 'active',
    last_inspection: '',
  })

  function handleChange(field: string, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: formData.plate_number,
          model: formData.model,
          year: formData.year,
          capacity: formData.capacity,
          status: formData.status,
          last_inspection: formData.last_inspection || null,
        })

      if (error) throw error

      router.push('/admin/vehicles')
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/vehicles" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Fleet
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
        <p className="text-gray-500 mt-1">Register a new vehicle to the fleet</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {/* Plate & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plate Number *</label>
            <input
              type="text"
              required
              value={formData.plate_number}
              onChange={(e) => handleChange('plate_number', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC-123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Toyota Hiace"
            />
          </div>
        </div>

        {/* Year & Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
            <input
              type="number"
              required
              min={2000}
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
            <input
              type="number"
              required
              min={1}
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Last Inspection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Inspection Date</label>
          <input
            type="date"
            value={formData.last_inspection}
            onChange={(e) => handleChange('last_inspection', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/admin/vehicles"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  )
}
