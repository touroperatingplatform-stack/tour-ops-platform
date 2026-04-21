'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  status: string
}

interface Stop {
  id: string
  location_name: string
  address: string
  scheduled_time: string
  guest_count: number
  stop_type: 'pickup' | 'activity' | 'dropoff'
  sort_order: number
}

interface Checkin {
  id: string
  pickup_stop_id: string
  checkin_type: string
  checked_in_at: string
  location_lat: number | null
  location_lng: number | null
}

function PickupCheckinContent() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    try {
      const { data: tourData } = await supabase
        .from('tours')
        .select('id, name, status')
        .eq('id', params.id)
        .single()

      if (tourData) setTour(tourData)

      const { data: stopsData } = await supabase
        .from('pickup_stops')
        .select('id, location_name, address, scheduled_time, guest_count, stop_type, sort_order')
        .eq('tour_id', params.id)
        .eq('stop_type', 'pickup')
        .order('sort_order')

      if (stopsData) setStops(stopsData)

      const { data: checkinsData } = await supabase
        .from('guide_checkins')
        .select('id, pickup_stop_id, checkin_type, checked_in_at, location_lat, location_lng')
        .eq('tour_id', params.id)
        .eq('checkin_type', 'pickup')

      if (checkinsData) setCheckins(checkinsData)
    } catch (error) {
      console.error('Error loading:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(stopId: string) {
    setCheckingIn(stopId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (e) {
          console.log('GPS not available')
        }
      }

      await supabase.from('guide_checkins').insert({
        tour_id: params.id,
        pickup_stop_id: stopId,
        checkin_type: 'pickup',
        checked_in_at: new Date().toISOString(),
        location_lat: location?.lat,
        location_lng: location?.lng
      })

      router.push(`/driver/tours/${params.id}`)
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in. Please try again.')
    } finally {
      setCheckingIn(null)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">{t('common.loading')}</div>
  }

  if (!tour) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">❌</div>
        <h2 className="text-lg font-semibold">Tour not found</h2>
        <Link href="/driver" className="text-blue-600 mt-2 inline-block">← Back to Dashboard</Link>
      </div>
    )
  }

  const isCheckedIn = (stopId: string) => checkins.some(c => c.pickup_stop_id === stopId)

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/driver/tours/${params.id}`} className="text-gray-500 hover:text-gray-700">← {t('common.back')}</Link>
        <span className="text-sm text-gray-500">Pickup Check-in</span>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">{tour.name}</h1>
        <p className="text-gray-500 text-sm">Pickup Locations</p>
      </div>

      <div className="space-y-3">
        {stops.map((stop, idx) => (
          <div key={stop.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-gray-500 uppercase">Stop {idx + 1}</div>
                <div className="font-semibold text-lg">{stop.location_name}</div>
                <div className="text-sm text-gray-600">{stop.address}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {stop.scheduled_time?.slice(0, 5)} • {stop.guest_count} guests
                </div>
              </div>
              {isCheckedIn(stop.id) ? (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Checked In
                </div>
              ) : (
                <button
                  onClick={() => handleCheckIn(stop.id)}
                  disabled={checkingIn === stop.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {checkingIn === stop.id ? 'Checking In...' : 'Check In'}
                </button>
              )}
            </div>
          </div>
        ))}

        {stops.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pickup stops for this tour
          </div>
        )}
      </div>
    </div>
  )
}

export default function PickupCheckinPage() {
  return (
    <DriverNav>
      <PickupCheckinContent />
    </DriverNav>
  )
}
