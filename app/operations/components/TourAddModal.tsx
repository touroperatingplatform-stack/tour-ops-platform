'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TourAddModalProps {
  selectedDate: string
  onClose: () => void
  onSave: () => void
}

export default function TourAddModal({ selectedDate, onClose, onSave }: TourAddModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [guides, setGuides] = useState<Array<{ id: string; name: string }>>([])
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string; capacity: number }>>([])
  const [formData, setFormData] = useState({
    name: '',
    start_time: '08:00',
    capacity: 20,
    guide_id: '',
    driver_id: '',
    vehicle_id: '',
    pickup_location: '',
    dropoff_location: '',
    notes: '',
    price: ''
  })

  useEffect(() => {
    // Load guides, drivers, and vehicles for dropdowns
    async function loadResources() {
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['guide', 'operations', 'manager', 'company_admin'])

      const { data: driversData } = await supabase
        .from('driver_profiles')
        .select(`
          profile_id,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')

      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, plate_number, capacity')
        .eq('status', 'available')

      if (guidesData) {
        setGuides(guidesData.map(g => ({
          id: g.id,
          name: `${g.first_name || ''} ${g.last_name || ''}`.trim()
        })))
      }

      if (driversData) {
        setDrivers(driversData.map(d => ({
          id: d.profile_id,
          name: `${d.profiles.first_name || ''} ${d.profiles.last_name || ''}`.trim()
        })))
      }

      if (vehiclesData) {
        setVehicles(vehiclesData.map(v => ({
          id: v.id,
          plate: v.plate_number,
          capacity: v.capacity
        })))
      }
    }
    loadResources()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const tourData: any = {
        name: formData.name,
        tour_date: selectedDate,
        start_time: formData.start_time,
        capacity: formData.capacity,
        guide_id: formData.guide_id || null,
        driver_id: formData.driver_id || null,
        vehicle_id: formData.vehicle_id || null,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        notes: formData.notes || null,
        status: 'scheduled',
        guest_count: 0,
        price: formData.price ? parseFloat(formData.price) : null
      }

      const { error } = await supabase
        .from('tours')
        .insert([tourData])

      if (error) throw error
      onSave()
    } catch (error: any) {
      alert('Error creating tour: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{t('schedule.addTour') || 'Agregar Tour'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('schedule.tour')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Chichen Itza Sunrise"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('schedule.time')} *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.capacity')} *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                min="1"
                max="60"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('schedule.guide')}
              </label>
              <select
                value={formData.guide_id}
                onChange={(e) => setFormData({ ...formData, guide_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {guides.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('schedule.driver')}
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('schedule.vehicle')}
            </label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate} ({v.capacity}👥)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup
            </label>
            <input
              type="text"
              value={formData.pickup_location}
              onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
              placeholder="Lugar de recogida"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dropoff
            </label>
            <input
              type="text"
              value={formData.dropoff_location}
              onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
              placeholder="Lugar de entrega"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas especiales..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('common.saving') : t('schedule.createTour') || 'Crear Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
