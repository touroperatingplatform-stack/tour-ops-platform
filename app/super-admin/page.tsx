'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface DemoStats {
  tours: number
  guests: number
  pickup_stops: number
  checkins: number
  incidents: number
  expenses: number
  feedback: number
  activity: number
  vehicles: number
}

export default function SuperAdminPage() {
  const [demoStats, setDemoStats] = useState<DemoStats>({
    tours: 0, guests: 0, pickup_stops: 0, checkins: 0, incidents: 0, expenses: 0, feedback: 0, activity: 0, vehicles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDemoStats()
  }, [])

  async function loadDemoStats() {
    const tables = ['tours', 'guests', 'pickup_stops', 'guide_checkins', 'incidents', 'tour_expenses', 'guest_feedback', 'activity_feed', 'vehicles']
    const stats: any = {}
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) console.error(`Failed to count ${table}:`, error)
      stats[table] = count || 0
    }
    
    setDemoStats({
      tours: stats.tours || 0,
      guests: stats.guests || 0,
      pickup_stops: stats.pickup_stops || 0,
      checkins: stats.guide_checkins || 0,
      incidents: stats.incidents || 0,
      expenses: stats.tour_expenses || 0,
      feedback: stats.guest_feedback || 0,
      activity: stats.activity_feed || 0,
      vehicles: stats.vehicles || 0
    })
    setLoading(false)
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Platform overview and quick stats</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{demoStats.tours}</div>
                <div className="text-sm text-gray-600">Tours</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{demoStats.guests}</div>
                <div className="text-sm text-gray-600">Guests</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{demoStats.checkins}</div>
                <div className="text-sm text-gray-600">Check-ins</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-orange-600">{demoStats.incidents}</div>
                <div className="text-sm text-gray-600">Incidents</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-red-600">{demoStats.expenses}</div>
                <div className="text-sm text-gray-600">Expenses</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-pink-600">{demoStats.feedback}</div>
                <div className="text-sm text-gray-600">Feedback</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-indigo-600">{demoStats.vehicles}</div>
                <div className="text-sm text-gray-600">Vehicles</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{demoStats.pickup_stops}</div>
                <div className="text-sm text-gray-600">Stops</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-teal-600">{demoStats.activity}</div>
                <div className="text-sm text-gray-600">Activity</div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/super-admin/companies" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">🏢 Companies</h3>
              <p className="text-sm text-gray-500 mt-1">Manage tour companies</p>
            </a>
            <a href="/super-admin/brands" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">🏷️ Brands</h3>
              <p className="text-sm text-gray-500 mt-1">Configure brand identities</p>
            </a>
            <a href="/super-admin/users" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">👥 Users</h3>
              <p className="text-sm text-gray-500 mt-1">Manage user accounts</p>
            </a>
            <a href="/super-admin/demo" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">📦 Demo Data</h3>
              <p className="text-sm text-gray-500 mt-1">Generate or clear test data</p>
            </a>
            <a href="/super-admin/settings" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">⚙️ Settings</h3>
              <p className="text-sm text-gray-500 mt-1">API and system config</p>
            </a>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
