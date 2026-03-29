'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getLocalDate, getConfiguredTimezone, DEFAULT_TIMEZONE } from '@/lib/timezone'

export default function OperationsReportsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'tours' | 'vehicles' | 'guides'>('tours')
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week'>('today')
  const [loading, setLoading] = useState(true)
  const [timezone, setTimezone] = useState<string>(DEFAULT_TIMEZONE)

  useEffect(() => {
    getConfiguredTimezone().then(setTimezone)
  }, [])

  // Tour Performance Data
  const [tourStats, setTourStats] = useState({
    totalTours: 0,
    totalGuests: 0,
    avgCapacity: 0,
    cancelled: 0,
    cashCollected: 0,
    cashSpent: 0,
    cashToReturn: 0
  })
  const [tourBreakdown, setTourBreakdown] = useState<Array<{ name: string; count: number; guests: number }>>([])

  // Vehicle Utilization Data
  const [vehicleStats, setVehicleStats] = useState({
    totalVehicles: 0,
    inUse: 0,
    available: 0,
    maintenance: 0,
    avgUtilization: 0
  })
  const [vehicleUsage, setVehicleUsage] = useState<Array<{ plate: string; make: string; model: string; toursCount: number; daysUsed: number }>>([])

  // Guide Performance Data
  const [guideStats, setGuideStats] = useState({
    totalGuides: 0,
    checkedIn: 0,
    onTime: 0,
    late: 0,
    reconciliationsPending: 0,
    reconciliationsComplete: 0,
    discrepancies: 0
  })
  const [guidePerformance, setGuidePerformance] = useState<Array<{ name: string; toursCount: number; onTimePercent: number; cashPending: number }>>([])

  useEffect(() => {
    if (timezone) {
      loadData()
    }
  }, [dateRange, activeTab, timezone])

  async function loadData() {
    setLoading(true)
    
    const dateFilters = getDateFilters()

    if (activeTab === 'tours') {
      await loadTourPerformance(dateFilters)
    } else if (activeTab === 'vehicles') {
      await loadVehicleUtilization(dateFilters)
    } else if (activeTab === 'guides') {
      await loadGuidePerformance(dateFilters)
    }

    setLoading(false)
  }

  function getDateFilters() {
    const today = getLocalDate(timezone)
    
    if (dateRange === 'today') {
      return { start: today, end: today }
    } else if (dateRange === 'yesterday') {
      const [y, m, d] = today.split('-').map(Number)
      const prevDay = new Date(y, m - 1, d - 1)
      const yesterdayStr = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`
      return { start: yesterdayStr, end: yesterdayStr }
    } else {
      // Last 7 days
      const [y, m, d] = today.split('-').map(Number)
      const weekAgo = new Date(y, m - 1, d - 7)
      const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
      return { start: weekAgoStr, end: today }
    }
  }

  async function loadTourPerformance(dateFilters: { start: string; end: string }) {
    // Load tours
    const { data: tours } = await supabase
      .from('tours')
      .select('*')
      .gte('tour_date', dateFilters.start)
      .lte('tour_date', dateFilters.end)

    if (!tours) return

    const totalTours = tours.length
    const cancelled = tours.filter(t => t.status === 'cancelled').length
    const activeTours = tours.filter(t => t.status !== 'cancelled')
    
    const totalGuests = activeTours.reduce((sum, t) => sum + (t.report_guest_count || t.guest_count || 0), 0)
    const totalCapacity = activeTours.reduce((sum, t) => sum + (t.capacity || 0), 0)
    const avgCapacity = totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0

    const cashCollected = activeTours.reduce((sum, t) => sum + (t.report_cash_received || 0), 0)
    const cashSpent = activeTours.reduce((sum, t) => sum + (t.report_cash_spent || 0), 0)
    const cashToReturn = activeTours.reduce((sum, t) => sum + (t.report_cash_to_return || 0), 0)

    // Tour breakdown by name
    const breakdown: Record<string, { count: number; guests: number }> = {}
    tours.forEach(t => {
      if (t.status === 'cancelled') return
      if (!breakdown[t.name]) {
        breakdown[t.name] = { count: 0, guests: 0 }
      }
      breakdown[t.name].count++
      breakdown[t.name].guests += (t.report_guest_count || t.guest_count || 0)
    })

    const tourBreakdown = Object.entries(breakdown)
      .map(([name, data]) => ({ name, count: data.count, guests: data.guests }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setTourStats({ totalTours, totalGuests, avgCapacity, cancelled, cashCollected, cashSpent, cashToReturn })
    setTourBreakdown(tourBreakdown)
  }

  async function loadVehicleUtilization(dateFilters: { start: string; end: string }) {
    // Load all vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')

    if (!vehicles) return

    // Load tours with vehicles in date range
    const { data: tours } = await supabase
      .from('tours')
      .select('vehicle_id, tour_date')
      .gte('tour_date', dateFilters.start)
      .lte('tour_date', dateFilters.end)
      .neq('status', 'cancelled')

    const vehicleUsageMap: Record<string, { plate: string; make: string; model: string; toursCount: number; dates: Set<string> }> = {}

    vehicles.forEach(v => {
      vehicleUsageMap[v.id] = {
        plate: v.plate_number,
        make: v.make,
        model: v.model,
        toursCount: 0,
        dates: new Set()
      }
    })

    tours?.forEach(t => {
      if (t.vehicle_id && vehicleUsageMap[t.vehicle_id]) {
        vehicleUsageMap[t.vehicle_id].toursCount++
        vehicleUsageMap[t.vehicle_id].dates.add(t.tour_date)
      }
    })

    const usage = Object.values(vehicleUsageMap)
      .map(v => ({
        plate: v.plate,
        make: v.make,
        model: v.model,
        toursCount: v.toursCount,
        daysUsed: v.dates.size
      }))
      .sort((a, b) => b.toursCount - a.toursCount)

    const inUse = vehicles.filter(v => v.status === 'in_use').length
    const available = vehicles.filter(v => v.status === 'available').length
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length
    const totalDays = dateRange === 'today' || dateRange === 'yesterday' ? 1 : 7
    const avgUtilization = vehicles.length > 0 
      ? Math.round((usage.reduce((sum, v) => sum + v.daysUsed, 0) / (vehicles.length * totalDays)) * 100)
      : 0

    setVehicleStats({ totalVehicles: vehicles.length, inUse, available, maintenance, avgUtilization })
    setVehicleUsage(usage)
  }

  async function loadGuidePerformance(dateFilters: { start: string; end: string }) {
    // Load guide check-ins (without nested join)
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('*')
      .gte('checked_in_at', dateFilters.start)
      .lte('checked_in_at', dateFilters.end)

    // Load cash confirmations (without nested join)
    const { data: confirmations } = await supabase
      .from('cash_confirmations')
      .select('*')
      .gte('created_at', dateFilters.start)
      .lte('created_at', dateFilters.end)

    // Load tours
    const { data: tours } = await supabase
      .from('tours')
      .select('guide_id, status')
      .gte('tour_date', dateFilters.start)
      .lte('tour_date', dateFilters.end)

    // Fetch guide names separately
    const guideIds = new Set<string>()
    checkins?.forEach(c => guideIds.add(c.guide_id))
    confirmations?.forEach(c => guideIds.add(c.guide_id))
    
    let guideNames: Record<string, string> = {}
    if (guideIds.size > 0) {
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', Array.from(guideIds))
      
      guideNames = {}
      guidesData?.forEach(g => {
        guideNames[g.id] = `${g.first_name || ''} ${g.last_name || ''}`.trim()
      })
    }

    const guideMap: Record<string, { 
      name: string; 
      toursCount: number; 
      onTime: number; 
      late: number; 
      cashPending: number;
      reconciliationsComplete: number;
      discrepancies: number;
    }> = {}

    // Process check-ins for punctuality
    checkins?.forEach(c => {
      const guideId = c.guide_id
      const guideName = guideNames[guideId] || 'Unknown'
      
      if (!guideMap[guideId]) {
        guideMap[guideId] = { name: guideName, toursCount: 0, onTime: 0, late: 0, cashPending: 0, reconciliationsComplete: 0, discrepancies: 0 }
      }
      
      guideMap[guideId].toursCount++
      if ((c.minutes_early_or_late || 0) <= 0) {
        guideMap[guideId].onTime++
      } else {
        guideMap[guideId].late++
      }
    })

    // Process cash confirmations
    confirmations?.forEach(c => {
      const guideId = c.guide_id
      const guideName = guideNames[guideId] || 'Unknown'
      
      if (!guideMap[guideId]) {
        guideMap[guideId] = { name: guideName, toursCount: 0, onTime: 0, late: 0, cashPending: 0, reconciliationsComplete: 0, discrepancies: 0 }
      }

      if (c.status === 'pending' || !c.status) {
        guideMap[guideId].cashPending += (c.cash_expected || 0)
      } else {
        guideMap[guideId].reconciliationsComplete++
        if (c.has_discrepancy) {
          guideMap[guideId].discrepancies++
        }
      }
    })

    const guidePerformance = Object.values(guideMap)
      .map(g => ({
        name: g.name,
        toursCount: g.toursCount,
        onTimePercent: g.toursCount > 0 ? Math.round((g.onTime / g.toursCount) * 100) : 0,
        cashPending: g.cashPending
      }))
      .sort((a, b) => b.toursCount - a.toursCount)

    const totalGuides = Object.keys(guideMap).length
    const checkedIn = totalGuides
    const onTime = Object.values(guideMap).reduce((sum, g) => sum + g.onTime, 0)
    const late = Object.values(guideMap).reduce((sum, g) => sum + g.late, 0)
    const reconciliationsPending = Object.values(guideMap).reduce((sum, g) => sum + (g.cashPending > 0 ? 1 : 0), 0)
    const reconciliationsComplete = Object.values(guideMap).reduce((sum, g) => sum + g.reconciliationsComplete, 0)
    const discrepancies = Object.values(guideMap).reduce((sum, g) => sum + g.discrepancies, 0)

    setGuideStats({ totalGuides, checkedIn, onTime, late, reconciliationsPending, reconciliationsComplete, discrepancies })
    setGuidePerformance(guidePerformance)
  }

  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('reports.title') || 'Reportes'}</h1>

          {/* Date Range Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t('time.today') || 'Hoy'}
              </button>
              <button
                onClick={() => setDateRange('yesterday')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t('time.yesterday') || 'Ayer'}
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t('time.lastWeek') || 'Últimos 7 días'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="border-b border-gray-200">
              <nav className="flex gap-4 px-4">
                <button
                  onClick={() => setActiveTab('tours')}
                  className={`py-3 px-2 border-b-2 text-sm font-medium ${activeTab === 'tours' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  📊 {t('reports.tourPerformance') || 'Rendimiento de Tours'}
                </button>
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`py-3 px-2 border-b-2 text-sm font-medium ${activeTab === 'vehicles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  🚌 {t('reports.vehicleUsage') || 'Uso de Vehículos'}
                </button>
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`py-3 px-2 border-b-2 text-sm font-medium ${activeTab === 'guides' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  👥 {t('reports.guidePerformance') || 'Rendimiento de Guías'}
                </button>
              </nav>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
              ) : activeTab === 'tours' ? (
                <TourPerformanceTab stats={tourStats} breakdown={tourBreakdown} />
              ) : activeTab === 'vehicles' ? (
                <VehicleUsageTab stats={vehicleStats} usage={vehicleUsage} />
              ) : (
                <GuidePerformanceTab stats={guideStats} performance={guidePerformance} />
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}

function TourPerformanceTab({ stats, breakdown }: { stats: any; breakdown: any[] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.totalTours') || 'Total Tours'} value={stats.totalTours} />
        <StatCard label={t('reports.totalGuests') || 'Huéspedes'} value={stats.totalGuests} />
        <StatCard label={t('reports.capacityUsed') || 'Capacidad Usada'} value={`${stats.avgCapacity}%`} />
        <StatCard label={t('reports.cancelled') || 'Cancelados'} value={stats.cancelled} color="red" />
      </div>

      {/* Cash Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">💰 {t('reports.cashSummary') || 'Resumen de Efectivo'}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-700">{t('reports.cashCollected') || 'Recaudado'}</p>
            <p className="text-lg font-bold text-blue-900">${stats.cashCollected.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">{t('reports.cashSpent') || 'Gastado'}</p>
            <p className="text-lg font-bold text-blue-900">${stats.cashSpent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">{t('reports.cashToReturn') || 'Por Retornar'}</p>
            <p className="text-lg font-bold text-blue-900">${stats.cashToReturn.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tour Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.tourBreakdown') || 'Desglose por Tour'}</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">{t('schedule.tour')}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.count')}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.guests')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breakdown.map((tour, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 text-sm text-gray-900">{tour.name}</td>
                  <td className="py-2 px-4 text-sm text-gray-700 text-right">{tour.count}</td>
                  <td className="py-2 px-4 text-sm text-gray-700 text-right">{tour.guests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VehicleUsageTab({ stats, usage }: { stats: any; usage: any[] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label={t('vehicles.total') || 'Total'} value={stats.totalVehicles} />
        <StatCard label={t('vehicles.available') || 'Disponible'} value={stats.available} color="green" />
        <StatCard label={t('vehicles.inUse') || 'En Uso'} value={stats.inUse} color="blue" />
        <StatCard label={t('vehicles.maintenance') || 'Mantenimiento'} value={stats.maintenance} color="red" />
        <StatCard label={t('reports.utilization') || 'Utilización'} value={`${stats.avgUtilization}%`} color="purple" />
      </div>

      {/* Vehicle Usage Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.vehicleUsageBy') || 'Uso por Vehículo'}</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">{t('vehicles.vehicle')}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.toursCount') || 'Tours'}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.daysUsed') || 'Días'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usage.map((v, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 text-sm text-gray-900">
                    {v.make} {v.model} <span className="font-mono text-gray-500">({v.plate})</span>
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-700 text-right">{v.toursCount}</td>
                  <td className="py-2 px-4 text-sm text-gray-700 text-right">{v.daysUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GuidePerformanceTab({ stats, performance }: { stats: any; performance: any[] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.totalGuides') || 'Total Guías'} value={stats.totalGuides} />
        <StatCard label={t('reports.onTime') || 'Puntuales'} value={stats.onTime} color="green" />
        <StatCard label={t('reports.late') || 'Tarde'} value={stats.late} color="yellow" />
        <StatCard label={t('reports.reconciliationsPending') || 'Por Reconciliar'} value={stats.reconciliationsPending} color="red" />
      </div>

      {/* Reconciliation Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-3">💵 {t('reports.reconciliationStatus') || 'Estado de Reconciliación'}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-purple-700">{t('reports.reconciliationsComplete') || 'Reconciliados'}</p>
            <p className="text-lg font-bold text-purple-900">{stats.reconciliationsComplete}</p>
          </div>
          <div>
            <p className="text-xs text-purple-700">{t('reports.pending') || 'Pendientes'}</p>
            <p className="text-lg font-bold text-purple-900">{stats.reconciliationsPending}</p>
          </div>
          <div>
            <p className="text-xs text-purple-700">{t('reports.discrepancies') || 'Discrepancias'}</p>
            <p className="text-lg font-bold text-purple-900">{stats.discrepancies}</p>
          </div>
        </div>
      </div>

      {/* Guide Performance Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.guidePerformanceBy') || 'Rendimiento por Guía'}</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">{t('schedule.guide')}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.toursCount')}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.onTimePercent') || '% Puntualidad'}</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">{t('reports.cashPending') || 'Efectivo Pendiente'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {performance.map((g, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 text-sm text-gray-900">{g.name}</td>
                  <td className="py-2 px-4 text-sm text-gray-700 text-right">{g.toursCount}</td>
                  <td className="py-2 px-4 text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${g.onTimePercent >= 90 ? 'bg-green-100 text-green-700' : g.onTimePercent >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {g.onTimePercent}%
                    </span>
                  </td>
                  <td className="py-2 px-4 text-sm text-right">
                    {g.cashPending > 0 ? (
                      <span className="text-red-600 font-medium">${g.cashPending.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'gray' }: { label: string; value: string | number; color?: 'gray' | 'green' | 'blue' | 'red' | 'purple' | 'yellow' }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  }

  return (
    <div className={`${colors[color]} border rounded-lg p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </div>
  )
}
