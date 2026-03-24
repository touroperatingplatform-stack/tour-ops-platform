'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadGuests()
  }, [])

  async function loadGuests() {
    let query = supabase
      .from('guests')
      .select(`
        *,
        tour:tours(id, name, tour_date)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    const { data } = await query

    if (data) {
      if (filter === 'checked_in') {
        setGuests(data.filter(g => g.checked_in))
      } else if (filter === 'no_show') {
        setGuests(data.filter(g => g.no_show))
      } else {
        setGuests(data)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading guests...</div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">All Guests</h1>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            loadGuests()
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Guests</option>
          <option value="checked_in">Checked In</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      <div className="space-y-3">
        {guests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No guests found</p>
          </div>
        ) : (
          guests.map((guest) => (
            <div key={guest.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {guest.first_name} {guest.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    🚌 {guest.tour?.name} • {guest.tour?.tour_date ? new Date(guest.tour.tour_date).toLocaleDateString() : 'TBD'}
                  </p>
                  <div className="text-sm text-gray-500 mt-1">
                    {guest.adults} adult{guest.adults > 1 ? 's' : ''}
                    {guest.children > 0 && ` • ${guest.children} child${guest.children > 1 ? 'ren' : ''}`}
                  </div>
                  {guest.hotel && (
                    <p className="text-sm text-gray-500">🏨 {guest.hotel} {guest.room_number && `#${guest.room_number}`}</p>
                  )}
                  {guest.phone && <p className="text-sm text-gray-500">📞 {guest.phone}</p>}
                  {guest.special_requirements && (
                    <p className="text-sm text-orange-600 mt-1">⚠️ {guest.special_requirements}</p>
                  )}
                </div>
                <div>
                  {guest.checked_in && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Checked In
                    </span>
                  )}
                  {guest.no_show && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      No Show
                    </span>
                  )}
                  {!guest.checked_in && !guest.no_show && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
