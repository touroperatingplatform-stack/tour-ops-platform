'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vehicle, setVehicle] = useState({
    id: '',
    name: '',
    plate_number: '',
    model: '',
    year: 2020,
    capacity: 10,
    status: 'active',
    last_inspection: '',
  })

  useEffect(() => {
    loadVehicle()
  }, [])

  async function loadVehicle() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading vehicle:', error)
      return
    }

    setVehicle({
      id: data.id,
      name: data.name || '',
      plate_number: data.plate_number || '',
      model: data.model || '',
      year: data.year || 2020,
      capacity: data.capacity || 10,
      status: data.status || 'active',
      last_inspection: data.last_inspection || '',
    })
    setLoading(false)
  }

  function handleChange(field: string, value: string | number) {
    setVehicle(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('vehicles')
      .update({
        name: vehicle.name,
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        year: vehicle.year,
        capacity: vehicle.capacity,
        status: vehicle.status,
        last_inspection: vehicle.last_inspection || null,
      })
      .eq('id', params.id)

    if (error) {
      alert('Failed to save vehicle')
    } else {
      router.push('/admin/vehicles')
    }
    setSaving(false)
  }

  async function deleteVehicle() {
    if (!confirm(t('vehicles.confirmDelete'))) return

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', params.id)

    if (error) {
      alert('Failed to delete')
    } else {
      router.push('/admin/vehicles')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <Link href="/admin/vehicles" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('vehicles.backToFleet')}
            </Link>
            <h1 className="text-xl font-bold">{t('vehicles.editVehicle')}</h1>
            <p className="text-gray-500 text-sm">{vehicle.model} • {vehicle.plate_number}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSave} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-md mx-auto space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Name *</label>
              <input
                type="text"
                required
                value={vehicle.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Plate & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.plateNumber')} *</label>
                <input
                  type="text"
                  required
                  value={vehicle.plate_number}
                  onChange={(e) => handleChange('plate_number', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.model')} *</label>
                <input
                  type="text"
                  required
                  value={vehicle.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Year & Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.year')} *</label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  value={vehicle.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.capacity')} *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={vehicle.capacity}
                  onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.status')} *</label>
              <select
                value={vehicle.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">{t('vehicles.active')}</option>
                <option value="maintenance">{t('vehicles.maintenance')}</option>
                <option value="inactive">{t('vehicles.inactive')}</option>
              </select>
            </div>

            {/* Last Inspection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('vehicles.lastInspection')}</label>
              <input
                type="date"
                value={vehicle.last_inspection}
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
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? t('vehicles.saving') : t('vehicles.saveChanges')}
              </button>
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={deleteVehicle}
              className="w-full bg-red-50 text-red-700 px-4 py-3 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              {t('vehicles.deleteVehicle')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}