'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Driver {
  id: string
  first_name: string
  last_name: string
  license_number?: string
  driver_type?: 'employee' | 'freelance'
  status: 'active' | 'inactive'
}

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  driver_id?: string
  driver_name?: string
}

interface DriverAssignmentProps {
  onAssignmentChange?: () => void
}

export default function DriverAssignment({ onAssignmentChange }: DriverAssignmentProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  // Get local date string (avoid timezone issues)
  const getLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [selectedDate, setSelectedDate] = useState(getLocalDate())

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function loadData() {
    setLoading(true)
    try {
      // Load active drivers
      const { data: driversData } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          profile_id,
          license_number,
          driver_type,
          status,
          profiles (
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')

      const formattedDrivers: Driver[] = (driversData || []).map((d: any) => ({
        id: d.profile_id,
        first_name: d.profiles.first_name,
        last_name: d.profiles.last_name,
        license_number: d.license_number,
        driver_type: d.driver_type,
        status: d.status
      }))
      
      // Deduplicate drivers by profile_id
      const uniqueDriversMap = new Map<string, Driver>()
      formattedDrivers.forEach((d) => {
        if (!uniqueDriversMap.has(d.id)) {
          uniqueDriversMap.set(d.id, d)
        }
      })
      setDrivers(Array.from(uniqueDriversMap.values()))

      // Load tours for selected date
      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id,
          name,
          tour_date,
          start_time,
          driver_id,
          driver_profiles!tours_driver_id_fkey (
            profile_id,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('tour_date', selectedDate)
        .neq('status', 'cancelled')
        .order('start_time')

      const formattedTours: Tour[] = (toursData || []).map((t: any) => ({
        ...t,
        driver_name: t.driver_profiles?.profiles 
          ? `${t.driver_profiles.profiles.first_name} ${t.driver_profiles.profiles.last_name}`
          : (t.driver_id ? 'Assigned' : undefined)
      }))
      
      // Deduplicate tours by id
      const uniqueToursMap = new Map<string, Tour>()
      formattedTours.forEach((t) => {
        if (!uniqueToursMap.has(t.id)) {
          uniqueToursMap.set(t.id, t)
        }
      })
      setTours(Array.from(uniqueToursMap.values()))
    } catch (error) {
      console.error('Error loading driver assignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function assignDriver(tourId: string, driverId: string) {
    setSaving(tourId)
    try {
      const { error } = await supabase
        .from('tours')
        .update({ driver_id: driverId || null })
        .eq('id', tourId)

      if (error) throw error

      onAssignmentChange?.()
      loadData() // Refresh
    } catch (error: any) {
      alert('Error assigning driver: ' + error.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{t('drivers.assignments') || 'Asignación de Choferes'}</h2>
          <p className="text-sm text-gray-500">
            {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {tours.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t('drivers.noToursToday') || 'No hay tours programados para hoy'}</p>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{tour.name}</p>
                  <p className="text-xs text-gray-500">{tour.start_time}</p>
                </div>
                {saving === tour.id && (
                  <span className="text-xs text-blue-600">{t('common.saving') || 'Guardando...'}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">{t('drivers.driver') || 'Chofer:'}</label>
                <select
                  value={tour.driver_id || ''}
                  onChange={(e) => assignDriver(tour.id, e.target.value)}
                  disabled={saving === tour.id}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">{t('drivers.unassigned') || 'No Asignado'}</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                      {driver.driver_type === 'freelance' ? ` (${t('drivers.freelance') || 'Freelance'})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {tour.driver_name && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {t('drivers.assignedTo') || 'Asignado a'} {tour.driver_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>{t('drivers.availableDrivers') || 'Choferes Disponibles'}:</strong> {drivers.length} {t('common.active') || 'activos'}
        </p>
        {drivers.length === 0 && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ {t('drivers.noActiveDrivers') || 'No hay choferes activos. Agrega choferes en Operaciones → Choferes'}
          </p>
        )}
      </div>
    </div>
  )
}
