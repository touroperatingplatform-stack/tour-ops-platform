'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getLocalDate } from '@/lib/timezone'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  hotel?: string
  room_number?: string
  pickup_location?: string
  status: 'pending' | 'checked_in' | 'no_show'
  tour_name?: string
  tour_date?: string
}

export default function GuestsPage() {
  const { t } = useTranslation()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'checked_in' | 'no_show'>('all')
  const [selectedDate, setSelectedDate] = useState(getLocalDate())

  useEffect(() => {
    loadGuests()
  }, [selectedDate])

  async function loadGuests() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const companyId = profile?.company_id
      if (!companyId) return

      // Load guests from reservation_manifest with tour info
      const { data } = await supabase
        .from('reservation_manifest')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          hotel,
          room_number,
          pickup_location,
          status,
          tours:tour_id (
            name,
            tour_date
          )
        `)
        .eq('company_id', companyId)
        .eq('tour_date', selectedDate)
        .order('created_at', { ascending: false })

      const formatted: Guest[] = (data || []).map((g: any) => ({
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email,
        phone: g.phone,
        hotel: g.hotel,
        room_number: g.room_number,
        pickup_location: g.pickup_location,
        status: g.status,
        tour_name: g.tours?.name,
        tour_date: g.tours?.tour_date
      }))

      setGuests(formatted)
    } catch (error) {
      console.error('Error loading guests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateGuestStatus(guestId: string, newStatus: 'checked_in' | 'no_show') {
    try {
      const { error } = await supabase
        .from('reservation_manifest')
        .update({ status: newStatus })
        .eq('id', guestId)

      if (error) throw error
      loadGuests()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const filteredGuests = guests.filter(g => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        g.first_name.toLowerCase().includes(q) ||
        g.last_name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        (g.hotel || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const checkedIn = guests.filter(g => g.status === 'checked_in').length
  const noShow = guests.filter(g => g.status === 'no_show').length
  const pending = guests.filter(g => g.status === 'pending').length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('guests.title') || 'Guests'}</h1>
            <p className="text-sm text-gray-500">{t('guests.subtitle') || 'Manage guest check-ins and assignments'}</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold">{guests.length}</p>
            <p className="text-sm text-gray-500">{t('guests.total') || 'Total'}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{checkedIn}</p>
            <p className="text-sm text-gray-500">{t('guests.checkedIn') || 'Checked In'}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            <p className="text-sm text-gray-500">{t('guests.pending') || 'Pending'}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{noShow}</p>
            <p className="text-sm text-gray-500">{t('guests.noShow') || 'No Show'}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('guests.searchPlaceholder') || 'Search by name, email, hotel...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{t('guests.pending')}</option>
                <option value="checked_in">{t('guests.checkedIn')}</option>
                <option value="no_show">{t('guests.noShow')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guests List */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('guests.contact') || 'Contact'}</th>
                  <th className="px-4 py-3 font-medium">{t('guests.hotel') || 'Hotel'}</th>
                  <th className="px-4 py-3 font-medium">{t('guests.tour') || 'Tour'}</th>
                  <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{guest.first_name} {guest.last_name}</p>
                      {guest.room_number && (
                        <p className="text-xs text-gray-500">Room {guest.room_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{guest.email}</p>
                      {guest.phone && <p className="text-xs text-gray-500">{guest.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{guest.hotel || '-'}</p>
                      {guest.pickup_location && (
                        <p className="text-xs text-gray-500">{guest.pickup_location}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{guest.tour_name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        guest.status === 'checked_in'
                          ? 'bg-green-100 text-green-700'
                          : guest.status === 'no_show'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {guest.status === 'checked_in'
                          ? (t('guests.checkedIn') || 'Checked In')
                          : guest.status === 'no_show'
                          ? (t('guests.noShow') || 'No Show')
                          : (t('guests.pending') || 'Pending')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {guest.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateGuestStatus(guest.id, 'checked_in')}
                              className="text-green-600 hover:underline text-xs font-medium"
                            >
                              {t('guests.checkIn') || 'Check In'}
                            </button>
                            <button
                              onClick={() => updateGuestStatus(guest.id, 'no_show')}
                              className="text-red-600 hover:underline text-xs font-medium"
                            >
                              {t('guests.markNoShow') || 'No Show'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGuests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {t('guests.noGuests') || 'No guests found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
