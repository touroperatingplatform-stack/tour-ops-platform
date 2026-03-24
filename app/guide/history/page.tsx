'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function GuideHistoryPage() {
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data } = await supabase
        .from('tours')
        .select('*')
        .eq('guide_id', session.user.id)
        .in('status', ['completed', 'cancelled'])
        .order('tour_date', { ascending: false })
        .limit(20)

      setTours(data || [])
      setLoading(false)
    }

    loadHistory()
  }, [])

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Past Tours</h1>

      {tours.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No past tours yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="font-semibold text-gray-900">{tour.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(tour.tour_date).toLocaleDateString()} at {tour.start_time}
              </p>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                tour.status === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {tour.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
