'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
  const { t, locale } = useTranslation()
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

    const { data: tours } = await supabase
      .from('tours')
      .select('id, status, guest_count, guide_id')
      .eq('tour_date', today)
      .neq('status', 'cancelled')

    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, type, severity, tour_name, created_at, status')
      .eq('created_at', today)
      .order('created_at', { ascending: false })

    const { count: guidesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'guide')
      .eq('status', 'active')

    const activeTours = tours?.filter(t => t.status === 'in_progress').length || 0
    const completedTours = tours?.filter(t => t.status === 'completed').length || 0
    const totalGuests = tours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0
    const openIncidents = incidents?.filter(i => i.status !== 'resolved').length || 0

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
      onTimeRate: 94,
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
        <div className="h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="company_admin">
      <div className="h-full grid grid-cols-12 grid-rows-[auto_auto_1fr] gap-3">
            
            {/* Row 1: KPI Cards */}
            <div className="col-span-12 grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">{t('adminDashboard.toursToday')}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold">{stats.toursCompleted}/{stats.toursTotal}</span>
                  <span className="text-xs text-green-600 font-medium">{t('adminDashboard.live')}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-blue-600 uppercase font-medium">{t('adminDashboard.guestsToday')}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.guestsToday}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-green-600 uppercase font-medium">{t('adminDashboard.onTimeRate')}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.onTimeRate}%</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-red-600 uppercase font-medium">{t('adminDashboard.incidents')}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.incidentsOpen}</p>
              </div>
            </div>

            {/* Row 2: Middle Section */}
            <div className="col-span-12 grid grid-cols-12 gap-3">
              {/* Active Tours + Team - Left */}
              <div className="col-span-4 grid grid-rows-2 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase font-medium">{t('adminDashboard.activeTours')}</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{stats.toursActive} {t('adminDashboard.live')}</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.toursActive}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">{t('adminDashboard.teamStatus')}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-xl font-bold">{stats.guidesActive}/{stats.guidesTotal}</p>
                      <p className="text-xs text-gray-500">{t('adminDashboard.guides')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">6</p>
                      <p className="text-xs text-gray-500">{t('adminDashboard.vehicles')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attention Required - Center */}
              <div className="col-span-5 bg-white rounded-lg border border-gray-200 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">⚠️ {t('adminDashboard.attentionRequired')}</span>
                  <span className="text-gray-400 text-xs">{attentionItems.length} {t('adminDashboard.items')}</span>
                </div>
                
                <div className="flex-1 space-y-2 overflow-hidden">
                  {attentionItems.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 text-sm">{t('adminDashboard.allClear')}</div>
                  ) : (
                    attentionItems.map(item => (
                      <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(item.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-gray-500 text-xs truncate">{item.tour} • {item.time}</p>
                        </div>
                        <button className="text-blue-600 text-xs whitespace-nowrap">{t('common.view')} →</button>
                      </div>
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

            {/* Row 3: Bottom Section */}
            <div className="col-span-12 grid grid-cols-12 gap-3">
              {/* Timeline */}
              <div className="col-span-9 bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{t('adminDashboard.todaysTimeline')}</span>
                  <span className="text-gray-400 text-xs">{stats.toursTotal} {t('nav.tours').toLowerCase()}</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time, i) => (
                    <div key={time} className="flex-1 text-center">
                      <div className={`w-full rounded-t ${i < 3 ? 'bg-green-500' : i === 3 ? 'bg-blue-500' : 'bg-gray-200'}`} 
                           style={{ height: `${30 + Math.random() * 20}px` }} />
                      <div className="text-xs text-gray-400 mt-1">{time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fleet Status */}
              <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3">
                <span className="font-semibold text-sm">{t('adminDashboard.fleetStatus')}</span>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs">{t('adminDashboard.inUse')}</span>
                    <span className="font-bold">4</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs">{t('adminDashboard.available')}</span>
                    <span className="font-bold">2</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs">{t('adminDashboard.maintenance')}</span>
                    <span className="font-bold text-red-600">0</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
