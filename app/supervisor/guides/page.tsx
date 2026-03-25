'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface GuideWithStats {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  // Stats
  total_tours: number
  completed_tours: number
  avg_satisfaction: number
  on_time_rate: number
  // Today's status
  today_tour_status: string | null
  today_tour_name: string | null
  today_checkin_status: string | null
}

export default function SupervisorGuidesPage() {
  const [guides, setGuides] = useState<GuideWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    const today = new Date().toISOString().split('T')[0]

    // Get all guides
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .eq('role', 'guide')
      .order('first_name')

    if (!guidesData) {
      setLoading(false)
      return
    }

    // Get stats for each guide
    const guidesWithStats = await Promise.all(
      guidesData.map(async (guide) => {
        // Total tours
        const { count: totalTours } = await supabase
          .from('tours')
          .select('*', { count: 'exact' })
          .eq('guide_id', guide.id)

        // Completed tours
        const { count: completedTours } = await supabase
          .from('tours')
          .select('*', { count: 'exact' })
          .eq('guide_id', guide.id)
          .eq('status', 'completed')

        // Today's tour
        const { data: todayTour } = await supabase
          .from('tours')
          .select('id, name, status')
          .eq('guide_id', guide.id)
          .eq('tour_date', today)
          .neq('status', 'cancelled')
          .maybeSingle()

        // Check if checked in
        let checkinStatus = null
        if (todayTour?.id) {
          const { data: checkin } = await supabase
            .from('guide_checkins')
            .select('id')
            .eq('tour_id', todayTour.id)
            .eq('checkin_type', 'pre_pickup')
            .maybeSingle()
          checkinStatus = checkin ? 'checked_in' : 'not_checked_in'
        }

        return {
          ...guide,
          total_tours: totalTours || 0,
          completed_tours: completedTours || 0,
          avg_satisfaction: 0, // TODO: calculate from reports
          on_time_rate: 0, // TODO: calculate from checkins
          today_tour_status: todayTour?.status || null,
          today_tour_name: todayTour?.name || null,
          today_checkin_status: checkinStatus,
        }
      })
    )

    setGuides(guidesWithStats)
    setLoading(false)
  }

  function getTodayStatusColor(status: string | null, checkinStatus: string | null) {
    if (!status) return 'bg-gray-100 text-gray-500'
    if (status === 'completed') return 'bg-green-100 text-green-700'
    if (status === 'in_progress') return 'bg-blue-100 text-blue-700'
    if (status === 'scheduled') {
      if (checkinStatus === 'checked_in') return 'bg-yellow-100 text-yellow-700'
      return 'bg-gray-100 text-gray-700'
    }
    return 'bg-gray-100 text-gray-500'
  }

  function getTodayStatusLabel(status: string | null, checkinStatus: string | null) {
    if (!status) return 'No tour today'
    if (status === 'completed') return '✓ Completed'
    if (status === 'in_progress') return '🟢 In progress'
    if (status === 'scheduled') {
      if (checkinStatus === 'checked_in') return '⏳ Checked in'
      return '⏰ Scheduled'
    }
    return status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/supervisor" className="text-blue-600 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Guides</h1>
          <p className="text-gray-500 text-sm mt-1">
            {guides.length} active guides
          </p>
        </div>

        {/* Guides List */}
        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {guide.first_name} {guide.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{guide.email}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      📊 {guide.completed_tours}/{guide.total_tours} tours completed
                    </span>
                  </div>
                </div>
                
                {/* Today's Status */}
                <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  getTodayStatusColor(guide.today_tour_status, guide.today_checkin_status)
                }`}>
                  {getTodayStatusLabel(guide.today_tour_status, guide.today_checkin_status)}
                </div>
              </div>

              {/* Today's Tour Details */}
              {guide.today_tour_name && guide.today_tour_status !== 'completed' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Today's Tour:</p>
                  <p className="text-sm text-gray-600">{guide.today_tour_name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
