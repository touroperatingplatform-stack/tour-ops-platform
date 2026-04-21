'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  pickup_location: string
  dropoff_location: string
  start_time: string
  tour_type: string
  guide_id: string | null
  guide_name: string
  vehicle_plate: string
  status: string
  acknowledged_at: string | null
}

interface Stop {
  id: string
  location_name: string
  stop_type: 'pickup' | 'activity' | 'dropoff'
}

interface Checkin {
  id: string
  checkin_type: string
}

function TourDetailContent() {
  const { t } = useTranslation()
  const params = useParams()
  const tourId = params.id as string
  
  const [tour, setTour] = useState<Tour | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tourId) loadTour()
  }, [tourId])

  async function loadTour() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tourData } = await supabase
        .from('tours')
        .select(`
          id, name, pickup_location, dropoff_location, start_time,
          tour_type, guide_id, status, acknowledged_at,
          profiles!guide_id (first_name, last_name),
          vehicles!vehicle_id (plate_number)
        `)
        .eq('id', tourId)
        .eq('driver_id', user.id)
        .single()

      if (tourData) {
        const profile = Array.isArray(tourData.profiles) ? tourData.profiles[0] : tourData.profiles
        const vehicle = Array.isArray(tourData.vehicles) ? tourData.vehicles[0] : tourData.vehicles
        setTour({
          ...tourData,
          guide_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unassigned',
          vehicle_plate: vehicle?.plate_number || 'Unknown'
        })
      }

      // Load stops
      const { data: stopsData } = await supabase
        .from('pickup_stops')
        .select('id, location_name, stop_type')
        .eq('tour_id', tourId)
        .order('sort_order')

      if (stopsData) setStops(stopsData)

      // Load checkins
      const { data: checkinsData } = await supabase
        .from('guide_checkins')
        .select('id, checkin_type')
        .eq('tour_id', tourId)

      if (checkinsData) setCheckins(checkinsData)
    } catch (error) {
      console.error('Error loading tour:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">❌</div>
        <h2 className="text-lg font-semibold">Tour not found</h2>
        <Link href="/driver" className="text-blue-600 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const isTransfer = !tour.guide_id

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/driver" className="text-gray-500 hover:text-gray-700">
          ← {t('common.back')}
        </Link>
        <span className="text-sm text-gray-500">Tour Details</span>
      </div>

      {/* Tour Info Card */}
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">{tour.name}</h1>
        <p className="text-gray-500 text-sm mb-4">{tour.vehicle_plate}</p>

        {isTransfer ? (
          <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium mb-4">
            🚗 Transfer Only
          </div>
        ) : (
          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium mb-4">
            👤 With Guide: {tour.guide_name}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-600 mt-1">📍</span>
            <div>
              <div className="text-xs text-gray-500 uppercase">Pickup</div>
              <div className="font-medium">{tour.pickup_location}</div>
              <div className="text-sm text-gray-500">{tour.start_time?.slice(0, 5)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-red-600 mt-1">🏁</span>
            <div>
              <div className="text-xs text-gray-500 uppercase">Dropoff</div>
              <div className="font-medium">{tour.dropoff_location}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gates Progress */}
      {!isTransfer && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Tour Gates</h2>
          <div className="space-y-2">
            <GateRow
              icon="📋"
              label="Acknowledge Tour"
              href={`/driver/tours/${tourId}/acknowledge`}
              completed={!!tour.acknowledged_at}
              status={tour.status}
              requiredStatus="scheduled"
            />
            <GateRow
              icon="🚌"
              label="Pre-Trip Check-in"
              href={`/driver/tours/${tourId}/checkin`}
              completed={checkins.some(c => c.checkin_type === 'checkin')}
              status={tour.status}
              requiredStatus="scheduled"
            />
            <GateRow
              icon="👥"
              label="Pickup Check-in"
              href={`/driver/tours/${tourId}/pickup`}
              completed={checkins.some(c => c.checkin_type === 'pickup')}
              status={tour.status}
              requiredStatus="in_progress"
            />
            <GateRow
              icon="🎯"
              label="Activity Check-in"
              href={`/driver/tours/${tourId}/activity`}
              completed={checkins.some(c => c.checkin_type === 'activity')}
              status={tour.status}
              requiredStatus="in_progress"
            />
            <GateRow
              icon="🏁"
              label="Drop-off Check-in"
              href={`/driver/tours/${tourId}/dropoff`}
              completed={checkins.some(c => c.checkin_type === 'dropoff')}
              status={tour.status}
              requiredStatus="in_progress"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {tour.status === 'scheduled' && (
          <Link
            href={`/driver/tours/${tourId}/checkin`}
            className="block w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg text-center shadow-lg hover:bg-blue-700"
          >
            Start Pre-Trip Check-in
          </Link>
        )}

        {isTransfer && tour.status === 'in_progress' && (
          <Link
            href={`/driver/tours/${tourId}/transfer`}
            className="block w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg text-center shadow-lg hover:bg-green-700"
          >
            Continue Transfer
          </Link>
        )}

        {tour.status === 'completed' && (
          <div className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-semibold text-lg text-center">
            ✓ Tour Completed
          </div>
        )}
      </div>
    </div>
  )
}

function GateRow({ icon, label, href, completed, status, requiredStatus }: {
  icon: string
  label: string
  href: string
  completed: boolean
  status: string
  requiredStatus: string
}) {
  const isLocked = status !== requiredStatus && !completed
  
  return (
    <Link href={href} className={`flex items-center justify-between p-3 rounded-lg border ${
      completed ? 'bg-green-50 border-green-200' : isLocked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-medium text-sm">{label}</div>
          {completed && <div className="text-xs text-green-600">✓ Completed</div>}
        </div>
      </div>
      {isLocked ? (
        <span className="text-gray-400">🔒</span>
      ) : completed ? (
        <span className="text-green-600">✓</span>
      ) : (
        <span className="text-blue-600">→</span>
      )}
    </Link>
  )
}

export default function TourDetailPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <TourDetailContent />
      </DriverNav>
    </RoleGuard>
  )
}
