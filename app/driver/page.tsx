'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  start_time: string
  pickup_location: string
  guide_id: string | null
  guide_name: string
  vehicle: {
    plate_number: string
    model: string
  }
}

interface VehicleStatus {
  mileage: number
  fuel: string
  condition: string
}

function DriverDashboardContent() {
  const { t } = useTranslation()
  const [todayTour, setTodayTour] = useState<Tour | null>(null)
  const [checkinStatus, setCheckinStatus] = useState<'pending' | 'completed'>('pending')
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    mileage: 45234,
    fuel: '3/4',
    condition: 'good'
  })
  const [stats, setStats] = useState({
    tripsThisMonth: 24,
    onTimeRate: 98
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDriverData()
  }, [])

  async function loadDriverData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = getLocalDate()

      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id, name, start_time, pickup_location, guide_id,
          profiles!guide_id (first_name, last_name),
          vehicles (plate_number, model)
        `)
        .eq('driver_id', user.id)
        .eq('tour_date', today)
        .neq('status', 'cancelled')
        .order('start_time')
        .limit(1)
        .single()

      if (toursData) {
        const profile = Array.isArray(toursData.profiles) ? toursData.profiles[0] : toursData.profiles
        setTodayTour({
          id: toursData.id,
          name: toursData.name,
          start_time: toursData.start_time,
          pickup_location: toursData.pickup_location,
          guide_id: toursData.guide_id,
          guide_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          vehicle: Array.isArray(toursData.vehicles) ? toursData.vehicles[0] : toursData.vehicles
        })
      }

      const { data: checkin } = await supabase
        .from('driver_checkins')
        .select('id')
        .eq('driver_id', user.id)
        .eq('tour_date', today)
        .single()

      setCheckinStatus(checkin ? 'completed' : 'pending')

    } catch (error) {
      console.error('Error loading driver data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <div className="p-4 space-y-4">
      {/* Today's Tour */}
      <div className="bg-white rounded-2xl shadow p-5">
        {todayTour ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  {t('driver.todaysTour')}
                </span>
                <span className="text-gray-400 text-sm">{todayTour.start_time?.slice(0, 5)}</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{todayTour.name}</h2>
              {todayTour.guide_id ? (
                // Tour with guide - show guide info
                <p className="text-gray-500 text-sm mb-3">{t('driver.guide')}: {todayTour.guide_name}</p>
              ) : (
                // Transfer only - show transfer badge
                <p className="text-amber-600 text-sm mb-3">🚗 {t('driver.transferOnly')}</p>
              )}
              
              {checkinStatus === 'pending' ? (
                <Link 
                  href={`/driver/tours/${todayTour.id}/checkin`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <span>📋</span>
                  <span>{t('driver.startPreTrip')}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  {!todayTour.guide_id ? (
                    // Transfer - go to transfer workflow
                    <Link 
                      href={`/driver/tours/${todayTour.id}/transfer`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <span>🚗</span>
                      <span>{t('driver.startTransfer')}</span>
                    </Link>
                  ) : (
                    // Tour with guide - link to tour detail
                    <Link 
                      href={`/driver/tours/${todayTour.id}`}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <span>✓</span>
                      <span>View Tour</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="bg-gray-100 rounded-xl p-3">
                <div className="text-2xl mb-1">🚌</div>
                <div className="font-bold text-sm">{todayTour.vehicle?.plate_number}</div>
                <div className="text-gray-500 text-xs">{todayTour.vehicle?.model}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">☕</div>
            <h2 className="text-lg font-semibold mb-1">{t('driver.noTourToday')}</h2>
            <p className="text-gray-500 text-sm">{t('driver.enjoyDayOff')}</p>
          </div>
        )}
      </div>

      {/* Vehicle Status */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">{t('driver.yourVehicle')}</span>
          <Link href="/driver/history" className="text-blue-600 text-sm">{t('driver.history')} →</Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⛽</span>
              </div>
              <div>
                <div className="font-medium">{t('driver.fuelLevel')}</div>
                <div className="text-gray-500 text-sm">{t('driver.lastUpdated')}</div>
              </div>
            </div>
            <span className="font-bold text-lg">{vehicleStatus.fuel}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <div className="font-medium">{t('driver.mileage')}</div>
                <div className="text-gray-500 text-sm">{t('driver.totalMiles')}</div>
              </div>
            </div>
            <span className="font-bold text-lg">{vehicleStatus.mileage.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <div className="font-medium">{t('driver.condition')}</div>
                <div className="text-gray-500 text-sm">{t('driver.overallStatus')}</div>
              </div>
            </div>
            <span className="text-green-600 font-bold">{vehicleStatus.condition}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow p-4">
        <span className="font-semibold">{t('driver.performance')}</span>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">{stats.tripsThisMonth}</div>
            <div className="text-gray-600 text-sm mt-1">{t('driver.tripsThisMonth')}</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">{stats.onTimeRate}%</div>
            <div className="text-gray-600 text-sm mt-1">{t('driver.onTimeRate')}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">{t('driver.weeklyActivity')}</div>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-blue-200 rounded-t hover:bg-blue-300 transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{t('driver.weekdays.mon')}</span>
            <span>{t('driver.weekdays.tue')}</span>
            <span>{t('driver.weekdays.wed')}</span>
            <span>{t('driver.weekdays.thu')}</span>
            <span>{t('driver.weekdays.fri')}</span>
            <span>{t('driver.weekdays.sat')}</span>
            <span>{t('driver.weekdays.sun')}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link 
          href="/driver/history"
          className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            📋
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">{t('driver.tripHistory')}</div>
            <div className="text-gray-500 text-xs">{t('driver.pastInspections')}</div>
          </div>
        </Link>

        <Link 
          href="/driver/profile"
          className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">{t('driver.myProfile')}</div>
            <div className="text-gray-500 text-xs">{t('driver.licenseSettings')}</div>
          </div>
        </Link>

        <button 
          className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
          onClick={() => alert('Support: Contact your supervisor')}
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
            🆘
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">{t('driver.reportIssue')}</div>
            <div className="text-gray-500 text-xs">{t('driver.needHelp')}</div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function DriverDashboardPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <DriverDashboardContent />
      </DriverNav>
    </RoleGuard>
  )
}