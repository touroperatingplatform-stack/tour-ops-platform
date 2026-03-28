'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface VehicleAddModalProps {
  onClose: () => void
  onSave: () => void
}

export default function VehicleAddModal({ onClose, onSave }: VehicleAddModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [isExternal, setIsExternal] = useState(false)
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined)
  const [freelanceDrivers, setFreelanceDrivers] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate_number: '',
    capacity: 13,
    status: 'available' as 'available' | 'in_use' | 'maintenance',
    mileage: 0,
    next_maintenance: ''
  })

  useEffect(() => {
    // Load freelance drivers for owner selection
    async function loadFreelanceDrivers() {
      const { data } = await supabase
        .from('driver_profiles')
        .select(`
          profile_id,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('driver_type', 'freelance')
        .eq('status', 'active')

      if (data) {
        const drivers = data.map((d: any) => ({
          id: d.profile_id,
          name: `${d.profiles.first_name || ''} ${d.profiles.last_name || ''}`.trim() || d.profiles.email
        }))
        setFreelanceDrivers(drivers)
      }
    }
    loadFreelanceDrivers()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const vehicleData: any = { ...formData }
      
      // If external, set owner_id
      if (isExternal && ownerId) {
        vehicleData.owner_id = ownerId
      }

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData])

      if (error) throw error
      onSave()
    } catch (error: any) {
      alert('Error creating vehicle: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('vehicles.addVehicle') || 'Agregar Vehículo'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Vehicle Type Toggle */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('vehicles.isExternal') || 'Vehículo de chofer externo (freelance)'}
              </span>
            </label>
          </div>

          {/* Owner Selection (if external) */}
          {isExternal && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.owner') || 'Propietario (Chofer)'}
              </label>
              <select
                value={ownerId || ''}
                onChange={(e) => setOwnerId(e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required={isExternal}
              >
                <option value="">Seleccionar chofer...</option>
                {freelanceDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.make') || 'Marca'}
              </label>
              <select
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Toyota">Toyota</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="Nissan">Nissan</option>
                <option value="Hyundai">Hyundai</option>
                <option value="Kia">Kia</option>
                <option value="Volkswagen">Volkswagen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.model') || 'Modelo'}
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ej: Hiace, Sprinter"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.year') || 'Año'}
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                min="2000"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.plate') || 'Placa'}
              </label>
              <input
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                placeholder="Ej: DEM-6215-0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.capacity') || 'Capacidad'}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.status') || 'Estado'}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">{t('vehicles.available') || 'Disponible'}</option>
                <option value="in_use">{t('vehicles.inUse') || 'En Uso'}</option>
                <option value="maintenance">{t('vehicles.maintenance') || 'Mantenimiento'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.mileage') || 'Kilometraje'}
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.nextMaintenance') || 'Próximo Mantenimiento'}
              </label>
              <input
                type="date"
                value={formData.next_maintenance}
                onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
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
              {loading ? t('common.saving') : t('vehicles.createVehicle') || 'Crear Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
