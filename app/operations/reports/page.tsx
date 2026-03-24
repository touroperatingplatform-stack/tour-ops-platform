'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function OperationsReportsPage() {
  const [stats, setStats] = useState({
    totalTours: 0,
    completed: 0,
    cancelled: 0,
    incidents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const today = new Date().toISOString().split('T')[0]

      // Get today's tours
      const { data: tours } = await supabase
        .from('tours')
        .select('status')
        .eq('tour_date', today)

      // Get today's incidents
      const { count: incidentCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)

      setStats({
        totalTours: tours?.length || 0,
        completed: tours?.filter(t => t.status === 'completed').length || 0,
        cancelled: tours?.filter(t => t.status === 'cancelled').length || 0,
        incidents: incidentCount || 0,
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Daily Report</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-sm text-gray-500 mb-1">Date</p>
        <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-blue-700">{stats.totalTours}</p>
          <p className="text-sm text-blue-600">Total Tours</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-sm text-green-600">Completed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
          <p className="text-sm text-red-600">Cancelled</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-orange-700">{stats.incidents}</p>
          <p className="text-sm text-orange-600">Incidents</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
            Export Daily Report
          </button>
          <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium">
            View Weekly Summary
          </button>
        </div>
      </div>
    </div>
  )
}
