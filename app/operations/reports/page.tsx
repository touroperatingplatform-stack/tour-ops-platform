'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    today: { tours: 0, completed: 0, guests: 0, incidents: 0, revenue: 0 },
    week: { tours: 0, completed: 0, guests: 0, incidents: 0, revenue: 0 },
    month: { tours: 0, completed: 0, guests: 0, incidents: 0, revenue: 0 },
  })
  const [recentIncidents, setRecentIncidents] = useState<any[]>([])
  const [topTours, setTopTours] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Today's stats
    const { data: todayTours } = await supabase
      .from('tours')
      .select('status, guest_count')
      .eq('tour_date', today)

    const { count: todayIncidents } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)

    // Week stats
    const { data: weekTours } = await supabase
      .from('tours')
      .select('status, guest_count')
      .gte('tour_date', weekAgo)
      .lte('tour_date', today)

    const { count: weekIncidents } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${weekAgo}T00:00:00`)

    // Month stats
    const { data: monthTours } = await supabase
      .from('tours')
      .select('status, guest_count')
      .gte('tour_date', monthAgo)
      .lte('tour_date', today)

    const { count: monthIncidents } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${monthAgo}T00:00:00`)

    // Recent incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select(`
        *,
        tour:tours(name),
        reporter:profiles(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    setStats({
      today: {
        tours: todayTours?.length || 0,
        completed: todayTours?.filter(t => t.status === 'completed').length || 0,
        guests: todayTours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0,
        incidents: todayIncidents || 0,
        revenue: 0, // Would need pricing data
      },
      week: {
        tours: weekTours?.length || 0,
        completed: weekTours?.filter(t => t.status === 'completed').length || 0,
        guests: weekTours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0,
        incidents: weekIncidents || 0,
        revenue: 0,
      },
      month: {
        tours: monthTours?.length || 0,
        completed: monthTours?.filter(t => t.status === 'completed').length || 0,
        guests: monthTours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0,
        incidents: monthIncidents || 0,
        revenue: 0,
      },
    })

    setRecentIncidents(incidents || [])
    setLoading(false)
  }

  if (loading) return <div className="p-4 text-center">Loading reports...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>

      {/* Today's Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Tours" value={stats.today.tours} color="blue" />
          <StatCard label="Completed" value={stats.today.completed} color="green" />
          <StatCard label="Guests" value={stats.today.guests} color="purple" />
          <StatCard label="Incidents" value={stats.today.incidents} color="red" />
        </div>
      </div>

      {/* Week Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">This Week</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Tours" value={stats.week.tours} color="blue" />
          <StatCard label="Completed" value={stats.week.completed} color="green" />
          <StatCard label="Guests" value={stats.week.guests} color="purple" />
          <StatCard label="Incidents" value={stats.week.incidents} color="red" />
        </div>
      </div>

      {/* Month Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">This Month</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Tours" value={stats.month.tours} color="blue" />
          <StatCard label="Completed" value={stats.month.completed} color="green" />
          <StatCard label="Guests" value={stats.month.guests} color="purple" />
          <StatCard label="Incidents" value={stats.month.incidents} color="red" />
        </div>
      </div>

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Incidents</h2>
          <div className="space-y-2">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-red-900">{incident.tour?.name}</p>
                <p className="text-sm text-red-700">{incident.description}</p>
                <p className="text-xs text-red-600 mt-1">
                  {new Date(incident.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Export Reports</h2>
        <div className="space-y-2">
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">
            📊 Export Daily Report (PDF)
          </button>
          <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">
            📈 Export Weekly Summary (CSV)
          </button>
          <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">
            📉 Export Monthly Analytics (CSV)
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className={`rounded-lg p-3 text-center border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
