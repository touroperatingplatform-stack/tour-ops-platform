'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import DriverNav from '@/components/navigation/DriverNav'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Checkin {
  id: string
  tour_id: string
  checked_in_at: string
  mileage_start: number | null
  mileage_end: number | null
  fuel_level_before: string | null
  fuel_level_after: string | null
  vehicle_condition: string | null
  issues: string | null
  tour?: {
    name: string
    tour_date: string
  }
}

function DriverHistoryContent() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [checkins, setCheckins] = useState<Checkin[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('driver_checkins')
        .select(`
          id, tour_id, checked_in_at, mileage_start, mileage_end,
          fuel_level_before, fuel_level_after, vehicle_condition, issues,
          tours!inner (name, tour_date)
        `)
        .eq('driver_id', user.id)
        .order('checked_in_at', { ascending: false })
        .limit(50)

      if (data) {
        setCheckins(data.map(c => ({
          ...c,
          tour: Array.isArray(c.tours) ? c.tours[0] : c.tours
        })))
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <div className="p-4">
      {checkins.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <span className="text-4xl block mb-3">📜</span>
          <p className="text-gray-900 font-medium">{t('driver.noInspections')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('driver.completeCheckinToSee')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div key={checkin.id} className="bg-white rounded-2xl p-5 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {checkin.tour?.name || 'Tour'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(checkin.checked_in_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  checkin.vehicle_condition === 'good' ? 'bg-green-100 text-green-700' :
                  checkin.vehicle_condition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {checkin.vehicle_condition || t('driver.unknown')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{t('driver.mileage')}</p>
                  <p className="font-medium text-gray-900">
                    {checkin.mileage_start ? `${checkin.mileage_start} km` : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{t('driver.fuelLevel')}</p>
                  <p className="font-medium text-gray-900">
                    {checkin.fuel_level_before ? checkin.fuel_level_before : '-'}
                  </p>
                </div>
              </div>

              {checkin.issues && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-medium">⚠️ {t('driver.issuesFound')}</p>
                  <p className="text-sm text-red-600 mt-1">{checkin.issues}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DriverHistoryPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <DriverHistoryContent />
      </DriverNav>
    </RoleGuard>
  )
}