'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
  const { t } = useTranslation()
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, noShow: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'no_show'>('all')
  const [showAll, setShowAll] = useState(true)

  useEffect(() => {
    loadGuests()
  }, [showAll])

  async function loadGuests() {
    setLoading(true)
    const today = getLocalDate()
    
    // Build base query
    let query = supabase
      .from('guests')
      .select(`
        id, first_name, last_name, hotel, room_number, adults, children, checked_in, no_show,
        tour:tours(name, tour_date)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    // Execute query
    const { data, error } = await query

    if (error) {
      console.error('Error loading guests:', error)
      setLoading(false)
      return
    }

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
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('nav.guests')}</h1>
              <p className="text-gray-500 text-sm">{showAll ? `${stats.total} ${t('common.total')}` : getLocalDate()}</p>
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 font-medium"
            >
              {showAll ? t('guests.todayOnly') : t('guests.showAll')}
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'all' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">{t('common.total')}</div>
          </button>
          <button 
            onClick={() => setFilter('checked_in')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'checked_in' ? 'bg-green-50 border-2 border-green-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-gray-500 text-xs">{t('guests.checkedIn')}</div>
          </button>
          <button 
            onClick={() => setFilter('no_show')}
            className={`rounded-xl shadow p-3 text-center ${filter === 'no_show' ? 'bg-red-50 border-2 border-red-500' : 'bg-white'}`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.noShow}</div>
            <div className="text-gray-500 text-xs">{t('guests.noShow')}</div>
          </button>
        </div>
      </div>

      {/* Filter Label */}
      <div className="px-4 py-2 flex-shrink-0 border-8 border-transparent">
        <p className="text-gray-500 text-sm">
          {t('guests.showing')} {filteredGuests.length} {t('guests.guests')}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
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
                    {guest.checked_in ? `✓ ${t('guests.checkedIn')}` : guest.no_show ? `✗ ${t('guests.noShow')}` : t('guests.pending')}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>🏨 {guest.hotel}</span>
                  <span>{t('guests.room')} {guest.room_number}</span>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span>👥 {guest.adults} {t('guests.adults')}</span>
                  {guest.children > 0 && <span>, {guest.children} {t('guests.children')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/guests" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">👥</span>
            <span className="text-xs">{t('nav.guests')}</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-xs">{t('profile.settings')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}