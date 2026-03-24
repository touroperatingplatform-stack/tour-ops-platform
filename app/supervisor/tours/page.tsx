'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SupervisorToursPage() {
  const [tours, setTours] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [view, setView] = useState('tours')

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Load tours based on filter
    let tourQuery = supabase
      .from('tours')
      .select(`
        *,
        guide:profiles(id, first_name, last_name, phone),
        vehicle:vehicles(plate_number),
        brand:brands(name)
      `)
      .order('tour_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (filter === 'today') {
      tourQuery = tourQuery.eq('tour_date', today)
    } else if (filter === 'week') {
      tourQuery = tourQuery.gte('tour_date', today).lte('tour_date', weekFromNow)
    } else if (filter === 'active') {
      tourQuery = tourQuery.eq('status', 'in_progress')
    }

    const { data: toursData } = await tourQuery

    // Load all guides with their tour counts
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, email')
      .eq('role', 'guide')
      .order('first_name')

    // Get tour counts for guides
    const guidesWithCounts = await Promise.all(
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

        return { ...guide, todayCount: todayCount || 0, weekCount: weekCount || 0 }
      })
    )

    setTours(toursData || [])
    setGuides(guidesWithCounts)
    setLoading(false)
  }

  async function reassignGuide(tourId: string, guideId: string) {
    const { error } = await supabase
      .from('tours')
      .update({ guide_id: guideId || null })
      .eq('id', tourId)

    if (!error) {
      loadData()
    } else {
      alert('Failed to reassign: ' + error.message)
    }
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>

  const activeTours = tours.filter(t => t.status === 'in_progress').length
  const completedToday = tours.filter(t => t.status === 'completed').length
  const pendingGuides = tours.filter(t => !t.guide_id && t.status === 'scheduled').length

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Tours & Guides</h1>

      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setView('tours')}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            view === 'tours' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          📅 Tours
        </button>
        <button
          onClick={() => setView('guides')}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            view === 'guides' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          👥 Guides
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{activeTours}</p>
          <p className="text-xs text-blue-600">Active Now</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{completedToday}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{pendingGuides}</p>
          <p className="text-xs text-orange-600">Need Guide</p>
        </div>
      </div>

      {view === 'tours' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {['today', 'week', 'active', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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

          {/* Tours List */}
          <div className="space-y-3">
            {tours.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No tours found</div>
            ) : (
              tours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tour.status === 'in_progress'
                              ? 'bg-blue-500'
                              : tour.status === 'completed'
                              ? 'bg-green-500'
                              : tour.status === 'cancelled'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <p className="font-semibold text-gray-900">{tour.name}</p>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(tour.tour_date).toLocaleDateString()} at {tour.start_time}
                      </p>
                      
                      {tour.guide ? (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900">
                            👤 {tour.guide.first_name} {tour.guide.last_name}
                          </p>
                          {tour.guide.phone && (
                            <p className="text-xs text-green-700">📞 {tour.guide.phone}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-700">⚠️ No guide assigned</p>
                        </div>
                      )}
                      
                      {tour.vehicle && (
                        <p className="text-sm text-gray-500 mt-1">🚐 {tour.vehicle.plate_number}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/guide/tours/${tour.id}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg text-center"
                      >
                        View
                      </Link>
                      <select
                        value={tour.guide_id || ''}
                        onChange={(e) => reassignGuide(tour.id, e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded-lg"
                      >
                        <option value="">Assign Guide</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.first_name} {g.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Guides List */}
          <div className="space-y-3">
            {guides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{guide.todayCount}</p>
                    <p className="text-xs text-gray-500">Tours Today</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{guide.weekCount}</p>
                    <p className="text-xs text-gray-500">This Week</p>
                  </div>
                  <div className="text-center">
                    <Link
                      href={`/guide/tours`}
                      className="text-sm text-blue-600 underline"
                    >
                      View Tours →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
