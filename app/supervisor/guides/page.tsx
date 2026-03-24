'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SupervisorGuidesPage() {
  const [guides, setGuides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, email, status')
      .eq('role', 'guide')
      .order('first_name')

    // Get tour counts and stats for each guide
    const guidesWithStats = await Promise.all(
      (guidesData || []).map(async (guide) => {
        const { count: todayCount } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', guide.id)
          .eq('tour_date', today)

        const { count: weekCount } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', guide.id)
          .gte('tour_date', today)
          .lte('tour_date', weekFromNow)

        const { count: activeNow } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', guide.id)
          .eq('status', 'in_progress')

        const { count: completedMonth } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', guide.id)
          .eq('status', 'completed')
          .gte('tour_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

        return {
          ...guide,
          todayCount: todayCount || 0,
          weekCount: weekCount || 0,
          activeNow: activeNow || 0,
          completedMonth: completedMonth || 0,
        }
      })
    )

    // Filter if needed
    let filtered = guidesWithStats
    if (filter === 'active') {
      filtered = guidesWithStats.filter(g => g.activeNow > 0)
    } else if (filter === 'available') {
      filtered = guidesWithStats.filter(g => g.activeNow === 0)
    }

    setGuides(filtered)
    setLoading(false)
  }

  if (loading) return <div className="p-4 text-center">Loading guides...</div>

  const totalGuides = guides.length
  const activeNow = guides.filter(g => g.activeNow > 0).length
  const totalToursToday = guides.reduce((sum, g) => sum + g.todayCount, 0)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Tour Guides</h1>
        <span className="text-sm text-gray-500">{totalGuides} guides</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{activeNow}</p>
          <p className="text-xs text-blue-600">On Tour Now</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{totalToursToday}</p>
          <p className="text-xs text-green-600">Tours Today</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalGuides - activeNow}</p>
          <p className="text-xs text-purple-600">Available</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'active', 'available'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              loadGuides()
            }}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Guides List */}
      <div className="space-y-3">
        {guides.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No guides found</div>
        ) : (
          guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    guide.activeNow > 0 ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {guide.first_name?.[0]}{guide.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {guide.first_name} {guide.last_name}
                    </p>
                    {guide.phone && (
                      <p className="text-sm text-gray-500">📞 {guide.phone}</p>
                    )}
                    {guide.email && (
                      <p className="text-sm text-gray-500">✉️ {guide.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {guide.activeNow > 0 ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      On Tour
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Available
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{guide.todayCount}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{guide.weekCount}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{guide.completedMonth}</p>
                  <p className="text-xs text-gray-500">Completed (30d)</p>
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href={`/admin/users/${guide.id}`}
                    className="text-sm text-blue-600 underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
