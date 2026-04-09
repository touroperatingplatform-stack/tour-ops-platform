'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Reservation {
  id: string
  booking_reference: string
  booking_platform: string
  adult_pax: number
  child_pax: number
  infant_pax: number
  total_pax: number
  primary_contact_name: string
  dietary_restrictions: string[]
  accessibility_needs: string[]
  special_requests: string | null
  checked_in: boolean
  no_show: boolean
  pickup_location: string | null
  hotel_name: string | null
}

export default function TourGuestsPage() {
  const params = useParams()
  const { t } = useTranslation()
  const tourId = params.id as string

  const [tourName, setTourName] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

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

    // Load reservations (ORDEN creates reservations, not reservation_manifest)
    const { data } = await supabase
      .from('reservations')
      .select('id, coupon, client_name, adults, children, babies, total_pax, hotel_name, pickup_time, confirmation_number, agency, checked_in, no_show')
      .eq('tour_id', tourId)
      .order('coupon')

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      booking_reference: r.coupon || r.confirmation_number,
      booking_platform: r.agency,
      adult_pax: r.adults || 0,
      child_pax: r.children || 0,
      infant_pax: r.babies || 0,
      total_pax: r.total_pax || ((r.adults || 0) + (r.children || 0) + (r.babies || 0)),
      primary_contact_name: r.client_name,
      dietary_restrictions: [],
      accessibility_needs: [],
      special_requests: null,
      checked_in: r.checked_in || false,
      no_show: r.no_show || false,
      pickup_location: r.hotel_name,
      hotel_name: r.hotel_name
    }))

    setReservations(formatted)
    setLoading(false)
  }

  const totalGuests = reservations.reduce((sum, r) => sum + r.total_pax, 0)
  const checkedInCount = reservations.filter(r => r.checked_in).length
  const noShowCount = reservations.filter(r => r.no_show).length

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading guests...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <Link href={`/admin/tours/${tourId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Tour
          </Link>
          <h1 className="text-xl font-bold">Guest Manifest</h1>
          <p className="text-gray-500 text-sm">{tourName}</p>
        </div>
      </header>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <p className="text-2xl font-bold">{reservations.length}</p>
            <p className="text-xs text-gray-500">Bookings</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{totalGuests}</p>
            <p className="text-xs text-green-600">Total Guests</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{checkedInCount}</p>
            <p className="text-xs text-blue-600">Checked In</p>
          </div>
        </div>

        {/* Add Guest Button */}
        <Link
          href={`/admin/tours/${tourId}/add-guest`}
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium mb-4"
        >
          + Add Guest
        </Link>

        {/* Guest List */}
        <div className="space-y-3">
          {reservations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">No guests yet</p>
              <Link
                href={`/admin/tours/${tourId}/add-guest`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Add First Guest
              </Link>
            </div>
          ) : (
            reservations.map((res) => (
              <div
                key={res.id}
                className={`bg-white rounded-xl border-2 p-4 ${
                  res.checked_in ? 'border-green-500 bg-green-50' :
                  res.no_show ? 'border-red-500 bg-red-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-lg">{res.primary_contact_name || 'Unknown'}</p>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      <p>
                        👥 {res.adult_pax} adults
                        {res.child_pax > 0 && ` • ${res.child_pax} children`}
                        {res.infant_pax > 0 && ` • ${res.infant_pax} infants`}
                      </p>
                      {res.hotel_name && <p>🏨 {res.hotel_name}</p>}
                      {res.pickup_location && <p>📍 {res.pickup_location}</p>}
                      {res.booking_reference && <p>🎫 Ref: {res.booking_reference}</p>}
                    </div>
                    {res.special_requests && (
                      <p className="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                        📝 {res.special_requests}
                      </p>
                    )}
                    {res.dietary_restrictions?.length > 0 && (
                      <p className="text-sm text-purple-600 mt-1">
                        🍽️ {res.dietary_restrictions.join(', ')}
                      </p>
                    )}
                  </div>
                  <div>
                    {res.checked_in ? (
                      <span className="text-green-600 font-medium text-sm">✓ Checked In</span>
                    ) : res.no_show ? (
                      <span className="text-red-600 font-medium text-sm">✗ No Show</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Pending</span>
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
