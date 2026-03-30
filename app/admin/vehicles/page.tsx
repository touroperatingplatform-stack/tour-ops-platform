'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import LanguageToggle from '@/components/LanguageToggle'
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
  const router = useRouter()
  const { t } = useTranslation()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model, year, capacity, status')
      .order('plate_number')

    if (error) {
      console.error('Error loading vehicles:', error)
    } else {
      setVehicles(data || [])
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
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
      <RoleGuard requiredRole="company_admin">
        <div className="h-screen flex flex-col bg-gray-100">
          {/* Top Nav */}
          <div className="bg-white border-b px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                T
              </div>
              <h1 className="text-lg font-bold">{t('adminDashboard.fleet')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                👤
              </button>
            </div>
          </div>
          
          {/* Loading */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="company_admin">
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Top Nav */}
        <div className="bg-white border-b px-4 py-3 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              T
            </div>
            <h1 className="text-lg font-bold">{t('adminDashboard.fleet')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button 
              onClick={handleSignOut}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
            >
              👤
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-3">
          <div className="h-full grid grid-cols-12 grid-rows-[auto_1fr] gap-3">
            
            {/* Row 1: Stats Cards */}
            <div className="col-span-12 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase font-medium">{t('fleet.total')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{vehicles.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-green-600 uppercase font-medium">{t('fleet.ready')}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{available}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-blue-600 uppercase font-medium">{t('fleet.onTour')}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{inUse}</p>
              </div>
            </div>

            {/* Row 2: Vehicle List + Quick Actions */}
            <div className="col-span-12 grid grid-cols-12 gap-3">
              {/* Vehicle List - Left */}
              <div className="col-span-9 bg-white rounded-lg border border-gray-200 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">🚐 {t('fleet.manageVehicles')}</span>
                  <Link href="/admin/vehicles/new" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">
                    + {t('common.add')}
                  </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2">
                  {vehicles.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">{t('fleet.noVehicles')}</div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <Link
                        key={vehicle.id}
                        href={`/admin/vehicles/${vehicle.id}`}
                        className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🚌</span>
                              <p className="font-semibold text-gray-900">{vehicle.plate_number}</p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status === 'in_use' ? t('fleet.onTour') : vehicle.status === 'available' ? t('fleet.ready') : t('fleet.maintenance')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 ml-6">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                            <p className="text-xs text-gray-400 ml-6">{vehicle.capacity} {t('fleet.seats')}</p>
                          </div>
                          <span className="text-blue-600 text-xs">→</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions - Right */}
              <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3 flex flex-col">
                <span className="font-semibold text-sm mb-2">{t('adminDashboard.quickActions')}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Link href="/admin/tours/new" className="flex flex-col items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                    <span className="text-xl mb-1">🚌</span>
                    <span className="text-xs font-medium">{t('adminDashboard.newTour')}</span>
                  </Link>
                  <Link href="/admin/users/new" className="flex flex-col items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded transition-colors">
                    <span className="text-xl mb-1">👤</span>
                    <span className="text-xs font-medium">{t('adminDashboard.addUser')}</span>
                  </Link>
                  <Link href="/admin/reports" className="flex flex-col items-center justify-center p-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
                    <span className="text-xl mb-1">📊</span>
                    <span className="text-xs font-medium">{t('nav.reports')}</span>
                  </Link>
                  <Link href="/admin/vehicles" className="flex flex-col items-center justify-center p-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors">
                    <span className="text-xl mb-1">🚗</span>
                    <span className="text-xs font-medium">{t('adminDashboard.fleet')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="bg-white border-t px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-around">
            <Link href="/admin" className="flex flex-col items-center text-gray-400">
              <span className="text-xl">📊</span>
              <span className="text-xs">{t('nav.dashboard')}</span>
            </Link>
            <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
              <span className="text-xl">🚌</span>
              <span className="text-xs">{t('nav.tours')}</span>
            </Link>
            <Link href="/admin/guests" className="flex flex-col items-center text-gray-400">
              <span className="text-xl">👤</span>
              <span className="text-xs">{t('nav.guests')}</span>
            </Link>
            <Link href="/admin/reports" className="flex flex-col items-center text-gray-400">
              <span className="text-xl">📈</span>
              <span className="text-xs">{t('nav.reports')}</span>
            </Link>
            <Link href="/admin/settings" className="flex flex-col items-center text-gray-400">
              <span className="text-xl">⚙️</span>
              <span className="text-xs">{t('common.menu')}</span>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
