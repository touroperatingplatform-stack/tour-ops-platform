'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import LanguageToggle from '@/components/LanguageToggle'

interface DashboardStats {
  toursTotal: number
  toursActive: number
  toursCompleted: number
  guestsToday: number
  incidentsOpen: number
  incidentsTotal: number
  onTimeRate: number
  guidesActive: number
  guidesTotal: number
}

interface AttentionItem {
  id: string
  type: 'incident' | 'checkin' | 'maintenance'
  severity: 'high' | 'medium' | 'low'
  title: string
  tour: string
  time: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    toursTotal: 0,
    toursActive: 0,
    toursCompleted: 0,
    guestsToday: 0,
    incidentsOpen: 0,
    incidentsTotal: 0,
    onTimeRate: 0,
    guidesActive: 0,
    guidesTotal: 0
  })
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadDashboardData() {
    const today = getLocalDate()

    // Load today's tours
    const { data: tours } = await supabase
      .from('tours')
      .select('id, status, guest_count, guide_id')
      .eq('tour_date', today)
      .neq('status', 'cancelled')

    // Load incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, type, severity, tour_name, created_at, status')
      .eq('created_at', today)
      .order('created_at', { ascending: false })

    // Load active guides
    const { count: guidesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'guide')
      .eq('status', 'active')

    // Calculate stats
    const activeTours = tours?.filter(t => t.status === 'in_progress').length || 0
    const completedTours = tours?.filter(t => t.status === 'completed').length || 0
    const totalGuests = tours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0
    const openIncidents = incidents?.filter(i => i.status !== 'resolved').length || 0

    // Build attention items
    const attention: AttentionItem[] = []
    incidents?.forEach(inc => {
      if (inc.status !== 'resolved') {
        attention.push({
          id: inc.id,
          type: 'incident',
          severity: inc.severity as 'high' | 'medium' | 'low',
          title: `${inc.type}: needs attention`,
          tour: inc.tour_name,
          time: new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      }
    })

    setStats({
      toursTotal: tours?.length || 0,
      toursActive: activeTours,
      toursCompleted: completedTours,
      guestsToday: totalGuests,
      incidentsOpen: openIncidents,
      incidentsTotal: incidents?.length || 0,
      onTimeRate: 94, // Calculate from check-ins
      guidesActive: activeTours,
      guidesTotal: guidesCount || 0
    })

    setAttentionItems(attention.slice(0, 3))
    setLoading(false)
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  if (loading) {
    return (
      <RoleGuard requiredRole="company_admin">
        <div className="h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="company_admin">
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Company Dashboard</h1>
              <p className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/super-admin" className="text-sm text-blue-600 hover:underline">
                ← Back to Super Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content - No Scroll */}
        <div className="flex-1 p-4 grid grid-cols-12 gap-4">
          
          {/* KPI Cards Row */}
          <div className="col-span-12 grid grid-cols-4 gap-4">
            {/* Tours */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Tours Today</span>
                <span className="text-green-500 text-xs font-bold">LIVE</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.toursCompleted}/{stats.toursTotal}</span>
                <span className="text-gray-400 text-sm">completed</span>
              </div>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 rounded-full h-2 transition-all"
                  style={{ width: `${(stats.toursCompleted / stats.toursTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Guests */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
              <span className="text-gray-500 text-sm font-medium">Guests Today</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.guestsToday}</span>
                <span className="text-gray-400 text-sm">total</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                <span>✓</span>
                <span>On track</span>
              </div>
            </div>

            {/* On Time */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
              <span className="text-gray-500 text-sm font-medium">On-Time Performance</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.onTimeRate}%</span>
              </div>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2 transition-all"
                  style={{ width: `${stats.onTimeRate}%` }}
                />
              </div>
            </div>

            {/* Incidents */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
              <span className="text-gray-500 text-sm font-medium">Incidents</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.incidentsOpen}</span>
                <span className="text-gray-400 text-sm">open</span>
              </div>
              {stats.incidentsOpen > 0 && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <span>⚠️</span>
                  <span>Needs attention</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Tours + Team Status */}
          <div className="col-span-4 grid grid-rows-2 gap-4">
            {/* Active Tours */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Active Tours</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {stats.toursActive} Live
                </span>
              </div>
              <div className="text-4xl font-bold text-blue-600">{stats.toursActive}</div>
              <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
            </div>

            {/* Team Status */}
            <div className="bg-white rounded-xl shadow p-4">
              <span className="font-semibold">Team Status</span>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.guidesActive}/{stats.guidesTotal}</div>
                  <div className="text-gray-500 text-xs">Guides Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-gray-500 text-xs">Vehicles</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attention Required */}
          <div className="col-span-5 bg-white rounded-xl shadow p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">⚠️ Attention Required</span>
              <span className="text-gray-400 text-sm">{attentionItems.length} items</span>
            </div>
            
            <div className="flex-1 space-y-2">
              {attentionItems.length === 0 ? (
                <div className="text-center text-gray-400 py-8">✓ All clear</div>
              ) : (
                attentionItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(item.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-gray-500 text-xs truncate">{item.tour} • {item.time}</p>
                    </div>
                    <button className="text-blue-600 text-xs whitespace-nowrap">Review →</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-3 bg-white rounded-xl shadow p-4 flex flex-col">
            <span className="font-semibold mb-3">Quick Actions</span>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Link href="/admin/tours" className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-2xl mb-1">🚌</span>
                <span className="text-xs font-medium text-center">New Tour</span>
              </Link>
              <Link href="/admin/users" className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <span className="text-2xl mb-1">👤</span>
                <span className="text-xs font-medium text-center">Add User</span>
              </Link>
              <Link href="/admin/reports" className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <span className="text-2xl mb-1">📊</span>
                <span className="text-xs font-medium text-center">Reports</span>
              </Link>
              <Link href="/admin/vehicles" className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <span className="text-2xl mb-1">🚗</span>
                <span className="text-xs font-medium text-center">Fleet</span>
              </Link>
            </div>
          </div>

          {/* Bottom Row - Live Timeline */}
          <div className="col-span-9 bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Today's Timeline</span>
              <span className="text-gray-400 text-sm">{stats.toursTotal} tours</span>
            </div>
            <div className="flex items-center gap-1">
              {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time, i) => (
                <div key={time} className="flex-1 text-center">
                  <div className="text-xs text-gray-400 mb-1">{time}</div>
                  <div className={`h-8 rounded ${i < 3 ? 'bg-green-500' : i === 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Status */}
          <div className="col-span-3 bg-white rounded-xl shadow p-4">
            <span className="font-semibold">Fleet Status</span>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>In Use</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Available</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Maintenance</span>
                <span className="font-bold text-red-600">0</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  )
}
