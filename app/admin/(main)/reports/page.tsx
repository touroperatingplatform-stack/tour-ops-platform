'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ReportCard {
  title: string
  value: string
  subtitle: string
  icon: string
  color: string
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    toursToday: 0,
    guestsToday: 0,
    revenue: 0,
    expenses: 0,
    incidents: 0,
    onTimeRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const today = getLocalDate()
    
    // Today's tours
    const { data: tours } = await supabase
      .from('tours')
      .select('id, status, guest_count')
      .eq('tour_date', today)

    // Today's guests
    const { data: guests } = await supabase
      .from('guests')
      .select('id')
      .eq('tour.tour_date', today)

    // Expenses
    const { data: expenses } = await supabase
      .from('tour_expenses')
      .select('amount')
      .eq('tour_date', today)

    // Incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id')
      .eq('created_at', today)

    const totalGuests = tours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    setStats({
      toursToday: tours?.length || 0,
      guestsToday: totalGuests,
      revenue: 0, // Would calculate from tour prices
      expenses: totalExpenses,
      incidents: incidents?.length || 0,
      onTimeRate: 94 // Placeholder
    })
    
    setLoading(false)
  }

  const reportCards: ReportCard[] = [
    {
      title: t('reports.toursToday'),
      value: stats.toursToday.toString(),
      subtitle: t('reports.totalScheduled'),
      icon: '🚌',
      color: 'bg-blue-500'
    },
    {
      title: t('reports.guestsToday'),
      value: stats.guestsToday.toString(),
      subtitle: t('reports.peopleServed'),
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      title: t('reports.onTimeRate'),
      value: `${stats.onTimeRate}%`,
      subtitle: t('reports.performance'),
      icon: '⏱️',
      color: 'bg-purple-500'
    },
    {
      title: t('reports.incidents'),
      value: stats.incidents.toString(),
      subtitle: t('time.today'),
      icon: '⚠️',
      color: 'bg-red-500'
    },
    {
      title: t('reports.expenses'),
      value: `$${stats.expenses.toLocaleString()}`,
      subtitle: t('time.today'),
      icon: '💰',
      color: 'bg-orange-500'
    },
    {
      title: t('reports.weeklyTrend'),
      value: '↑ 12%',
      subtitle: t('reports.vsLastWeek'),
      icon: '📈',
      color: 'bg-green-500'
    }
  ]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('nav.reports')}</h1>
              <p className="text-gray-500 text-sm">{getLocalDate()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          {/* Report Cards */}
          <div className="grid grid-cols-2 gap-3">
            {reportCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                  <div className={`w-2 h-2 rounded-full ${card.color}`}></div>
                </div>
                <div className="text-2xl font-bold mb-1">{card.value}</div>
                <div className="text-gray-500 text-sm">{card.title}</div>
                <div className="text-gray-400 text-xs">{card.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Quick Reports */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3">{t('reports.quickReports')}</h2>
            <div className="space-y-2">
              <Link href="/admin/reports/tours" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚌</span>
                  <div>
                    <div className="font-medium">{t('reports.tourReport')}</div>
                    <div className="text-gray-500 text-sm">{t('reports.tourReportDesc')}</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link href="/admin/reports/guides" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-medium">{t('reports.guideReport')}</div>
                    <div className="text-gray-500 text-sm">{t('reports.guideReportDesc')}</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>

              <Link href="/admin/reports/expenses" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-medium">{t('reports.expenseReport')}</div>
                    <div className="text-gray-500 text-sm">{t('reports.expenseReportDesc')}</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/guests" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">👥</span>
            <span className="text-xs">{t('nav.guests')}</span>
          </Link>
          <Link href="/admin/reports" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">📈</span>
            <span className="text-xs">{t('nav.reports')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}