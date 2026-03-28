'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface TourAssignment {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  guide: {
    first_name: string
    last_name: string
    phone?: string
  }
  vehicle?: {
    id: string
    plate_number: string
    model: string
    capacity: number
  }
}

interface DriverCheckin {
  id: string
  tour_id: string
  checked_in_at: string
  mileage_start: number | null
  fuel_level_before: string | null
  vehicle_condition: string | null
  issues: string | null
}

export default function DriverDashboard() {
  const [loading, setLoading] = useState(true)
  const [todayTour, setTodayTour] = useState<TourAssignment | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<DriverCheckin[]>([])
  const [stats, setStats] = useState({
    total_trips: 0,
    total_km: 0,
    fuel_reports: 0
  })

  useEffect(() => {
    loadDriverData()
  }, [])

  async function loadDriverData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

      // Get today's assigned tour
      const { data: tourData } = await supabase
        .from('tours')
        .select(`
          id, name, tour_date, start_time, status,
          profiles!guide_id (
            first_name, last_name, phone
          ),
          vehicles (
            id, plate_number, model, capacity
          )
        `)
        .eq('driver_id', user.id)
        .in('tour_date', [today, tomorrow])
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (tourData) {
        setTodayTour({
          ...tourData,
          guide: tourData.profiles as any,
          vehicle: Array.isArray(tourData.vehicles) ? tourData.vehicles[0] : tourData.vehicles
        })
      }

      // Get recent check-ins
      const { data: checkinsData } = await supabase
        .from('driver_checkins')
        .select('id, tour_id, checked_in_at, mileage_start, fuel_level_before, vehicle_condition, issues')
        .eq('driver_id', user.id)
        .order('checked_in_at', { ascending: false })
        .limit(5)

      setRecentCheckins(checkinsData || [])

      // Get driver stats
      const { count: tripCount } = await supabase
        .from('driver_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)

      setStats(prev => ({
        ...prev,
        total_trips: tripCount || 0,
        fuel_reports: checkinsData?.filter(c => c.fuel_level_before).length || 0
      }))

    } catch (error) {
      console.error('Error loading driver data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole="driver">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
                <p className="text-sm text-gray-500">Vehicle operations & inspections</p>
              </div>
              <Link
                href="/driver/checkin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                🚗 Vehicle Check-in
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Today's Assignment */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Assignment</h2>
            
            {todayTour ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{todayTour.name}</h3>
                      <p className="text-sm text-gray-500">
                        {todayTour.start_time} • {todayTour.status === 'in_progress' ? '🔵 In Progress' : '⏰ Scheduled'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      todayTour.status === 'in_progress' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {todayTour.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Guide Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase mb-1">Guide</p>
                      <p className="font-medium text-gray-900">
                        {todayTour.guide.first_name} {todayTour.guide.last_name}
                      </p>
                      {todayTour.guide.phone && (
                        <p className="text-sm text-gray-600">📞 {todayTour.guide.phone}</p>
                      )}
                    </div>

                    {/* Vehicle Info */}
                    {todayTour.vehicle && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase mb-1">Vehicle</p>
                        <p className="font-medium text-gray-900">{todayTour.vehicle.model}</p>
                        <p className="text-sm text-gray-600">🚗 {todayTour.vehicle.plate_number}</p>
                        <p className="text-sm text-gray-600">👥 {todayTour.vehicle.capacity} passengers</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase mb-1">Actions</p>
                      <Link
                        href={`/driver/checkin?tour_id=${todayTour.id}`}
                        className="inline-block text-sm text-blue-600 hover:underline font-medium"
                      >
                        Complete Check-in →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No tours assigned for today</p>
                <p className="text-sm text-gray-400 mt-1">Check back later or contact operations</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total_trips}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{stats.fuel_reports}</p>
              <p className="text-sm text-gray-500">Fuel Reports</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{recentCheckins.filter(c => c.vehicle_condition === 'good').length}</p>
              <p className="text-sm text-gray-500">Good Condition</p>
            </div>
          </div>

          {/* Recent Check-ins */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Vehicle Inspections</h2>
            
            {recentCheckins.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Mileage</th>
                      <th className="px-4 py-3 font-medium">Fuel</th>
                      <th className="px-4 py-3 font-medium">Condition</th>
                      <th className="px-4 py-3 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentCheckins.map((checkin) => (
                      <tr key={checkin.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {new Date(checkin.checked_in_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {checkin.mileage_start ? `${checkin.mileage_start} km` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {checkin.fuel_level_before ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                              {checkin.fuel_level_before}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {checkin.vehicle_condition ? (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              checkin.vehicle_condition === 'good' ? 'bg-green-100 text-green-700' :
                              checkin.vehicle_condition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {checkin.vehicle_condition}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {checkin.issues ? checkin.issues.slice(0, 30) + (checkin.issues.length > 30 ? '...' : '') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No inspections yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete a vehicle check-in to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
