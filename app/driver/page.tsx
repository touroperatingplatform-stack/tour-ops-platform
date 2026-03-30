'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'

interface Tour {
  id: string
  name: string
  start_time: string
  pickup_location: string
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

export default function DriverDashboard() {
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

      // Get today's assigned tour
      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id, name, start_time, pickup_location,
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
          guide_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          vehicle: Array.isArray(toursData.vehicles) ? toursData.vehicles[0] : toursData.vehicles
        })
      }

      // Check if already checked in
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
    return (
      <RoleGuard requiredRole="driver">
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="driver">
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Driver Dashboard</h1>
              <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600">Online</span>
            </div>
          </div>
        </div>

        {/* Main Content - No Scroll */}
        <div className="flex-1 p-4 grid grid-cols-12 gap-4">

          {/* Today's Tour - Big Card */}
          <div className="col-span-12 bg-white rounded-2xl shadow p-5">
            {todayTour ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                      TODAY'S TOUR
                    </span>
                    <span className="text-gray-400 text-sm">{todayTour.start_time?.slice(0, 5)}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{todayTour.name}</h2>
                  <p className="text-gray-500 text-sm mb-3">Guide: {todayTour.guide_name}</p>
                  
                  {checkinStatus === 'pending' ? (
                    <Link 
                      href={`/driver/tours/${todayTour.id}/checkin`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <span>🚗</span>
                      <span>Start Pre-Trip</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <span>✓</span>
                      <span>Check-in Complete</span>
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
                <h2 className="text-lg font-semibold mb-1">No Tour Today</h2>
                <p className="text-gray-500 text-sm">Enjoy your day off!</p>
              </div>
            )}
          </div>

          {/* Vehicle Status */}
          <div className="col-span-6 bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Your Vehicle</span>
              <Link href="/driver/history" className="text-blue-600 text-sm">History →</Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">⛽</span>
                  </div>
                  <div>
                    <div className="font-medium">Fuel Level</div>
                    <div className="text-gray-500 text-sm">Last updated today</div>
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
                    <div className="font-medium">Mileage</div>
                    <div className="text-gray-500 text-sm">Total miles</div>
                  </div>
                </div>
                <span className="font-bold text-lg">{vehicleStatus.mileage.toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                  <div>
                    <div className="font-medium">Condition</div>
                    <div className="text-gray-500 text-sm">Overall status</div>
                  </div>
                </div>
                <span className="text-green-600 font-bold">{vehicleStatus.condition}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-6 bg-white rounded-2xl shadow p-4">
            <span className="font-semibold">Performance</span>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{stats.tripsThisMonth}</div>
                <div className="text-gray-600 text-sm mt-1">Trips This Month</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{stats.onTimeRate}%</div>
                <div className="text-gray-600 text-sm mt-1">On-Time Rate</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">Weekly Activity</div>
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
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-12 grid grid-cols-3 gap-4">
            <Link 
              href="/driver/history"
              className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <div className="font-semibold">Trip History</div>
                <div className="text-gray-500 text-sm">Past inspections</div>
              </div>
            </Link>

            <Link 
              href="/driver/profile"
              className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <div className="font-semibold">My Profile</div>
                <div className="text-gray-500 text-sm">License & settings</div>
              </div>
            </Link>

            <button 
              className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Support: Contact your supervisor')}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                🆘
              </div>
              <div>
                <div className="font-semibold">Report Issue</div>
                <div className="text-gray-500 text-sm">Need help?</div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </RoleGuard>
  )
}
