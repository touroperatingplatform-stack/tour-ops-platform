'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  guide_name: string
  guest_count: number
}

export default function OperationsSchedulePage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadSchedule()
  }, [selectedDate])

  async function loadSchedule() {
    const { data, error } = await supabase
      .from('tours')
      .select(`
        id,
        name,
        tour_date,
        start_time,
        status,
        guest_count,
        guide_id
      `)
      .eq('tour_date', selectedDate)
      .neq('status', 'cancelled')
      .order('start_time')

    if (!error && data) {
      // Get guide names
      const guideIds = [...new Set(data.map(t => t.guide_id).filter(Boolean))]
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])

      const guideMap = new Map(guidesData?.map((g: any) => [g.id, `${g.first_name} ${g.last_name}`]) || [])

      const formattedTours = data.map((t: any) => ({
        ...t,
        guide_name: guideMap.get(t.guide_id) || 'Unassigned'
      }))

      setTours(formattedTours)
    }
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      scheduled: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      delayed: 'bg-yellow-100 text-yellow-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tours.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No tours scheduled for this date</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tour</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Guide</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Guests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tours.map((tour) => (
                      <tr key={tour.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="text-gray-900 font-medium">{tour.start_time?.slice(0, 5)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{tour.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">{tour.guide_name}</p>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(tour.status)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">{tour.guest_count || '-'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
