'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTours: 0,
    completedTours: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    activeGuides: 0,
    incidentsOpen: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Tours
      const { data: tours } = await supabase.from('tours').select('id, status')
      const totalTours = tours?.length || 0
      const completedTours = tours?.filter(t => t.status === 'completed').length || 0

      // Expenses
      const { data: expenses } = await supabase.from('expenses').select('amount')
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

      // Guides
      const { data: guides } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'guide')
        .eq('is_active', true)
      const activeGuides = guides?.length || 0

      // Incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'open')
      const incidentsOpen = incidents?.length || 0

      setStats({
        totalTours,
        completedTours,
        totalRevenue: 0, // TODO: Add revenue field to tours
        totalExpenses,
        activeGuides,
        incidentsOpen,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
    setLoading(false)
  }

  const completionRate = stats.totalTours > 0
    ? Math.round((stats.completedTours / stats.totalTours) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Overview of operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-600 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm">Total Tours</p>
          <p className="text-4xl font-bold mt-2">{stats.totalTours}</p>
          <p className="text-blue-100 text-sm mt-2">{stats.completedTours} completed</p>
        </div>
        <div className="bg-green-600 rounded-2xl p-6 text-white">
          <p className="text-green-100 text-sm">Completion Rate</p>
          <p className="text-4xl font-bold mt-2">{completionRate}%</p>
          <p className="text-green-100 text-sm mt-2">Of all tours</p>
        </div>
        <div className="bg-red-600 rounded-2xl p-6 text-white">
          <p className="text-red-100 text-sm">Expenses</p>
          <p className="text-4xl font-bold mt-2">${stats.totalExpenses.toFixed(0)}</p>
          <p className="text-red-100 text-sm mt-2">Total recorded</p>
        </div>
        <div className="bg-purple-600 rounded-2xl p-6 text-white">
          <p className="text-purple-100 text-sm">Active Guides</p>
          <p className="text-4xl font-bold mt-2">{stats.activeGuides}</p>
          <p className="text-purple-100 text-sm mt-2">Available staff</p>
        </div>
        <div className="bg-orange-600 rounded-2xl p-6 text-white">
          <p className="text-orange-100 text-sm">Open Incidents</p>
          <p className="text-4xl font-bold mt-2">{stats.incidentsOpen}</p>
          <p className="text-orange-100 text-sm mt-2">Need attention</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Export Data</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left">
            <p className="font-medium text-gray-900">Tours Report</p>
            <p className="text-sm text-gray-500">Export CSV</p>
          </button>
          <button className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left">
            <p className="font-medium text-gray-900">Expenses Report</p>
            <p className="text-sm text-gray-500">Export CSV</p>
          </button>
          <button className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left">
            <p className="font-medium text-gray-900">Incidents Report</p>
            <p className="text-sm text-gray-500">Export CSV</p>
          </button>
          <button className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left">
            <p className="font-medium text-gray-900">Staff Report</p>
            <p className="text-sm text-gray-500">Export CSV</p>
          </button>
        </div>
      </div>
    </div>
  )
}
