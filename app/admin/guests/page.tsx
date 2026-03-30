'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'

interface Guest {
  id: string
  first_name: string
  last_name: string
  hotel: string
  room_number: string
  adults: number
  children: number
  checked_in: boolean
  no_show: boolean
  tour_name: string
  tour_date: string
}

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] useState({ total: 0, checkedIn: 0, noShow: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'no_show'>('all')

  useEffect(() => {
    loadGuests()
  }, [])

  async function loadGuests() {
    const today = getLocalDate()
    
    const { data } = await supabase
      .from('guests')
      .select(`
        id, first_name, last_name, hotel, room_number, adults, children, checked_in, no_show,
        tour:tours(name, tour_date)
      `)
      .eq('tour.tour_date', today)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      const formatted = data.map((g: any) => ({
        ...g,
        tour_name: g.tour?.name || 'Unknown',
        tour_date: g.tour?.tour_date
      }))
      
      setGuests(formatted)
      setStats({
        total: formatted.length,
        checkedIn: formatted.filter((g: Guest) => g.checked_in).length,
        noShow: formatted.filter((g: Guest) => g.no_show).length
      })
    }
    setLoading(false)
  }

  const filteredGuests = guests.filter(g => {
    if (filter === 'checked_in') return g.checked_in
    if (filter === 'no_show') return g.no_show
    return true
  })

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading guests...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Today's Guests</h1>
        <p className="text-gray-500 text-sm">{getLocalDate()}</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'all' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">Total</div>
          </button>
          <button 
            onClick={() => setFilter('checked_in')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'checked_in' ? 'bg-green-50 border-2 border-green-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-gray-500 text-xs">Checked In</div>
          </button>
          <button 
            onClick={() => setFilter('no_show')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'no_show' ? 'bg-red-50 border-2 border-red-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.noShow}</div>
            <div className="text-gray-500 text-xs">No Show</div>
          </button>
        </div>
      </div>

      {/* Filter Label */}
      <div className="px-4 py-2 flex-shrink-0">
        <p className="text-gray-500 text-sm">
          Showing {filteredGuests.length} guests
        </p>
      </div>

      {/* Guest List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {filteredGuests.map(guest => (
            <div
              key={guest.id}
              className="bg-white rounded-xl shadow p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{guest.first_name} {guest.last_name}</h3>
                  <p className="text-gray-500 text-sm">{guest.tour_name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  guest.checked_in ? 'bg-green-100 text-green-700' :
                  guest.no_show ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {guest.checked_in ? '✓ Checked In' : guest.no_show ? '✗ No Show' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>🏨 {guest.hotel}</span>
                <span>Room {guest.room_number}</span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <span>👥 {guest.adults} adults</span>
                {guest.children > 0 && <span>, {guest.children} children</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/guests" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">👥</span>
            <span className="text-xs">Guests</span>
          </Link>
          <Link href="/admin/reports" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📈</span>
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
