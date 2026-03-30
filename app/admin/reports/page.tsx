'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'

interface ReportCard {
  title: string
  value: string
  subtitle: string
  icon: string
  color: string
}

export default function ReportsPage() {
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
      title: "Today's Tours",
      value: stats.toursToday.toString(),
      subtitle: 'Total scheduled',
      icon: '🚌',
      color: 'bg-blue-500'
    },
    {
      title: "Today's Guests",
      value: stats.guestsToday.toString(),
      subtitle: 'People served',
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      title: 'On-Time %',
      value: `${stats.onTimeRate}%`,
      subtitle: 'Performance',
      icon: '⏱️',
      color: 'bg-purple-500'
    },
    {
      title: 'Incidents',
      value: stats.incidents.toString(),
      subtitle: 'Today',
      icon: '⚠️',
      color: 'bg-red-500'
    },
    {
      title: 'Expenses',
      value: `$${stats.expenses.toLocaleString()}`,
      subtitle: 'Today',
      icon: '💰',
      color: 'bg-orange-500'
    },
    {
      title: 'Weekly Trend',
      value: '↑ 12%',
      subtitle: 'vs last week',
      icon: '📈',
      color: 'bg-green-500'
    }
  ]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-gray-500 text-sm">{getLocalDate()}</p>
      </div>

      {/* Report Cards */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
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
          <h2 className="font-semibold mb-3">Quick Reports</h2>
          <div className="space-y-2">
            <Link href="/admin/reports/tours" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚌</span>
                <div>
                  <div className="font-medium">Tour Report</div>
                  <div className="text-gray-500 text-sm">Performance by tour</div>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            <Link href="/admin/reports/guides" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-medium">Guide Report</div>
                  <div className="text-gray-500 text-sm">Performance by guide</div>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            <Link href="/admin/reports/expenses" className="block bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-medium">Expense Report</div>
                  <div className="text-gray-500 text-sm">Costs breakdown</div>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/guests" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs">Guests</span>
          </Link>
          <Link href="/admin/reports" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">📈</span>
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
