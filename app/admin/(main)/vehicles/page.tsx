'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Vehicle {
  id: string
  plate_number: string
  make: string
  model: string
  year: number
  capacity: number
  status: 'available' | 'in_use' | 'maintenance'
}

export default function VehiclesPage() {
  const { t } = useTranslation()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model, year, capacity, status')
      .eq('company_id', profile.company_id)
      .order('plate_number')

    if (error) {
      console.error('Error loading vehicles:', error)
    } else {
      setVehicles(data || [])
    }
    setLoading(false)
  }

  const available = vehicles.filter((v) => v.status === 'available').length
  const inUse = vehicles.filter((v) => v.status === 'in_use').length

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700'
      case 'in_use': return 'bg-blue-100 text-blue-700'
      case 'maintenance': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vehicles.title')}</h1>
            <p className="text-sm text-gray-500">{t('vehicles.subtitle')}</p>
          </div>
          <Link 
            href="/admin/vehicles/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            + {t('common.add')}
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-sm text-gray-500">{t('fleet.total')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{available}</p>
            <p className="text-sm text-gray-500">{t('fleet.ready')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{inUse}</p>
            <p className="text-sm text-gray-500">{t('fleet.onTour')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{vehicles.filter((v) => v.status === 'maintenance').length}</p>
            <p className="text-sm text-gray-500">{t('fleet.maintenance')}</p>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('vehicles.plate')}</th>
                  <th className="px-4 py-3 font-medium">{t('vehicles.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('vehicles.capacity')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{vehicle.plate_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{vehicle.capacity} {t('fleet.seats')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status === 'in_use' ? t('fleet.onTour') : vehicle.status === 'available' ? t('fleet.ready') : t('fleet.maintenance')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/vehicles/${vehicle.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {t('fleet.noVehicles')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}