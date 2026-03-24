'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  hotel: string
  room_number: string
  adults: number
  children: number
  special_requirements: string
  checked_in: boolean
  no_show: boolean
}

export default function TourGuestsPage() {
  const params = useParams()
  const tourId = params.id as string
  
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [tourName, setTourName] = useState('')

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour name
    const { data: tour } = await supabase
      .from('tours')
      .select('name')
      .eq('id', tourId)
      .single()
    
    if (tour) setTourName(tour.name)

    // Load guests
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('tour_id', tourId)
      .order('last_name')

    setGuests(data || [])
    setLoading(false)
  }

  async function checkInGuest(guestId: string) {
    await supabase
      .from('guests')
      .update({ 
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', guestId)

    loadData()
  }

  async function markNoShow(guestId: string) {
    await supabase
      .from('guests')
      .update({ no_show: true })
      .eq('id', guestId)

    loadData()
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading guests...</div>
  }

  const checkedInCount = guests.filter(g => g.checked_in).length
  const noShowCount = guests.filter(g => g.no_show).length
  const totalGuests = guests.reduce((sum, g) => sum + g.adults + g.children, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-white">←</button>
          <span className="font-semibold">Guest List</span>
        </div>
      </header>

      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{tourName}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {guests.length} bookings • {checkedInCount} checked in • {totalGuests} people
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <p className="text-2xl font-bold text-gray-900">{guests.length}</p>
            <p className="text-xs text-gray-500">Bookings</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{checkedInCount}</p>
            <p className="text-xs text-green-600">Checked In</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-700">{noShowCount}</p>
            <p className="text-xs text-red-600">No Show</p>
          </div>
        </div>

        {/* Guest List */}
        <div className="space-y-3">
          {guests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No guests yet</p>
            </div>
          ) : (
            guests.map((guest) => (
              <div 
                key={guest.id} 
                className={`bg-white rounded-lg p-4 border-2 ${
                  guest.checked_in ? 'border-green-500 bg-green-50' : 
                  guest.no_show ? 'border-red-500 bg-red-50' : 
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {guest.first_name} {guest.last_name}
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
                  
                  <div className="flex flex-col gap-2">
                    {!guest.checked_in && !guest.no_show && (
                      <>
                        <button
                          onClick={() => checkInGuest(guest.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => markNoShow(guest.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg"
                        >
                          No Show
                        </button>
                      </>
                    )}
                    {guest.checked_in && (
                      <span className="text-green-600 font-medium text-sm">✓ Checked In</span>
                    )}
                    {guest.no_show && (
                      <span className="text-red-600 font-medium text-sm">✗ No Show</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
