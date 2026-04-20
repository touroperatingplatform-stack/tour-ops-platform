'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TourData {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  guest_count: number
  guide_name?: string
  driver_name?: string
}

interface GuideData {
  id: string
  full_name: string
  total_tours: number
  total_guests: number
  rating: number
}

interface ExpenseData {
  id: string
  category: string
  amount: number
  guide_name: string
  tour_name: string
  status: string
  created_at: string
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'overview' | 'tours' | 'guides' | 'expenses'>('overview')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  // Overview stats
  const [stats, setStats] = useState({
    tours: 0,
    guests: 0,
    revenue: 0,
    expenses: 0,
    guides: 0,
    incidents: 0
  })
  
  // Chart data
  const [tourTrend, setTourTrend] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [guestTrend, setGuestTrend] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  
  // Table data
  const [tours, setTours] = useState<TourData[]>([])
  const [guides, setGuides] = useState<GuideData[]>([])
  const [expenses, setExpenses] = useState<ExpenseData[]>([])

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      setLoading(false)
      return
    }
    
    setCompanyId(profile.company_id)

    const today = getLocalDate()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const startDate = dateRange === 'today' ? today : dateRange === 'week' ? weekAgo : monthAgo

    // Load overview stats
    const [{ data: toursData }, { data: expensesData }, { data: guidesData }] = await Promise.all([
      supabase
        .from('tours')
        .select('id, name, tour_date, start_time, status, guest_count, guide:guide_id(first_name, last_name), driver:driver_id(first_name, last_name)')
        .eq('company_id', profile.company_id)
        .gte('tour_date', startDate)
        .lte('tour_date', today)
        .order('tour_date', { ascending: false }),
      supabase
        .from('tour_expenses')
        .select('id, category, amount, status, created_at, guide:guide_id(first_name, last_name), tour:tour_id(name)')
        .eq('company_id', profile.company_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'guide')
        .eq('status', 'active')
    ])

    const totalGuests = toursData?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0
    const totalExpenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    setStats({
      tours: toursData?.length || 0,
      guests: totalGuests,
      revenue: 0,
      expenses: totalExpenses,
      guides: guidesData?.length || 0,
      incidents: 0
    })

    // Format data for tables
    setTours((toursData || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      tour_date: t.tour_date,
      start_time: t.start_time,
      status: t.status,
      guest_count: t.guest_count || 0,
      guide_name: t.guide ? `${t.guide.first_name} ${t.guide.last_name}` : '-',
      driver_name: t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : '-'
    })))

    setGuides((guidesData || []).map((g: any) => ({
      id: g.id,
      full_name: `${g.first_name} ${g.last_name}`,
      total_tours: 0,
      total_guests: 0,
      rating: 0
    })))

    setExpenses((expensesData || []).map((e: any) => ({
      id: e.id,
      category: e.category,
      amount: e.amount,
      guide_name: e.guide ? `${e.guide.first_name} ${e.guide.last_name}` : '-',
      tour_name: e.tour?.name || '-',
      status: e.status,
      created_at: e.created_at
    })))

    // Generate trend data (last 7 days)
    const trend = Array(7).fill(0).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    
    const tourCounts = trend.map(date => 
      toursData?.filter((t: any) => t.tour_date === date).length || 0
    )
    const guestCounts = trend.map(date => 
      toursData?.filter((t: any) => t.tour_date === date).reduce((sum: number, t: any) => sum + (t.guest_count || 0), 0) || 0
    )
    
    setTourTrend(tourCounts)
    setGuestTrend(guestCounts)
    
    setLoading(false)
  }

  function exportReport() {
    // Simple CSV export
    const csv = 'Date,Tours,Guests,Expenses\n' + 
      `${getLocalDate()},${stats.tours},${stats.guests},${stats.expenses}\n`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${getLocalDate()}.csv`
    a.click()
  }

  const maxTours = Math.max(...tourTrend, 1)
  const maxGuests = Math.max(...guestTrend, 1)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent overflow-auto">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.reports')}</h1>
            <p className="text-sm text-gray-500">{t('reports.analytics') || 'Analytics & Performance'}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="today">{t('time.today')}</option>
              <option value="week">{t('time.thisWeek')}</option>
              <option value="month">{t('time.thisMonth')}</option>
            </select>
            <button
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {t('common.export') || 'Export'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'tours', 'guides', 'expenses'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t(`reports.${tab}`) || tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="flex-1 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">{t('reports.tours') || 'Tours'}</p>
                <p className="text-2xl font-bold">{stats.tours}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">{t('reports.guests') || 'Guests'}</p>
                <p className="text-2xl font-bold">{stats.guests}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">{t('reports.expenses') || 'Expenses'}</p>
                <p className="text-2xl font-bold text-red-600">${stats.expenses.toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">{t('reports.activeGuides') || 'Active Guides'}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.guides}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tours Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('reports.tourTrend') || 'Tour Trend'}</h3>
                <div className="h-40 flex items-end gap-2">
                  {tourTrend.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(count / maxTours) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {['S','M','T','W','T','F','S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guests Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('reports.guestTrend') || 'Guest Trend'}</h3>
                <div className="h-40 flex items-end gap-2">
                  {guestTrend.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${(count / maxGuests) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {['S','M','T','W','T','F','S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Tours */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold">{t('reports.recentTours') || 'Recent Tours'}</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">{t('tours.name')}</th>
                    <th className="px-4 py-2">{t('tours.date')}</th>
                    <th className="px-4 py-2">{t('tours.guests')}</th>
                    <th className="px-4 py-2">{t('tours.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tours.slice(0, 5).map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{tour.name}</td>
                      <td className="px-4 py-2 text-gray-500">{tour.tour_date}</td>
                      <td className="px-4 py-2">{tour.guest_count}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tour.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">{t('tours.name')}</th>
                    <th className="px-4 py-3">{t('tours.date')}</th>
                    <th className="px-4 py-3">{t('tours.time')}</th>
                    <th className="px-4 py-3">{t('tours.guests')}</th>
                    <th className="px-4 py-3">{t('guides.guide')}</th>
                    <th className="px-4 py-3">{t('drivers.driver')}</th>
                    <th className="px-4 py-3">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{tour.name}</td>
                      <td className="px-4 py-3 text-gray-500">{tour.tour_date}</td>
                      <td className="px-4 py-3">{tour.start_time?.slice(0, 5)}</td>
                      <td className="px-4 py-3">{tour.guest_count}</td>
                      <td className="px-4 py-3">{tour.guide_name}</td>
                      <td className="px-4 py-3">{tour.driver_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tour.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tour.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">{t('guides.name')}</th>
                    <th className="px-4 py-3">{t('reports.totalTours') || 'Total Tours'}</th>
                    <th className="px-4 py-3">{t('reports.totalGuests') || 'Total Guests'}</th>
                    <th className="px-4 py-3">{t('guides.rating') || 'Rating'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guides.map((guide) => (
                    <tr key={guide.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{guide.full_name}</td>
                      <td className="px-4 py-3">{guide.total_tours}</td>
                      <td className="px-4 py-3">{guide.total_guests}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{guide.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">{t('expenses.category')}</th>
                    <th className="px-4 py-3">{t('expenses.amount')}</th>
                    <th className="px-4 py-3">{t('expenses.guide')}</th>
                    <th className="px-4 py-3">{t('expenses.tour')}</th>
                    <th className="px-4 py-3">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 capitalize">{expense.category}</td>
                      <td className="px-4 py-3 font-medium">${expense.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{expense.guide_name}</td>
                      <td className="px-4 py-3">{expense.tour_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
