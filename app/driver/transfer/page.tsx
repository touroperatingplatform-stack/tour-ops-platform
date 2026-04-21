'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Guest {
  id: string
  first_name: string
  last_name: string
  phone: string
  hotel: string
  room_number: string
  adults: number
  children: number
}

interface TransferDetails {
  id: string
  name: string
  pickup_location: string
  dropoff_location: string
  start_time: string
  vehicle_plate: string
  guests: Guest[]
  status: 'vehicle_checked' | 'en_route_pickup' | 'picked_up' | 'en_route_dropoff' | 'completed'
  current_step: number
}

function TransferWorkflowContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  
  const [transfer, setTransfer] = useState<TransferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (tourId) loadTransfer()
  }, [tourId])

  async function loadTransfer() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !tourId) return

      // Get tour with guests
      const { data: tourData } = await supabase
        .from('tours')
        .select('id, name, pickup_location, dropoff_location, start_time, status, vehicle_id')
        .eq('id', tourId)
        .eq('driver_id', user.id)
        .single()

      if (!tourData) {
        setLoading(false)
        return
      }

      // Get vehicle plate
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('plate_number')
        .eq('id', tourData.vehicle_id)
        .single()

      // Get guests
      const { data: guestsData } = await supabase
        .from('guests')
        .select('id, first_name, last_name, phone, hotel, room_number, adults, children')
        .eq('tour_id', tourId)

      // Get current status from driver_checkins or driver_tracking
      const { data: trackingData } = await supabase
        .from('driver_tracking')
        .select('status, current_step')
        .eq('tour_id', tourId)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setTransfer({
        ...tourData,
        vehicle_plate: vehicleData?.plate_number || 'Unknown',
        guests: guestsData || [],
        status: trackingData?.status || 'vehicle_checked',
        current_step: trackingData?.current_step || 1
      })

    } catch (error) {
      console.error('Error loading transfer:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: TransferDetails['status'], step: number) {
    if (!transfer || !tourId) return
    
    setUpdating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current position if available
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (e) {
          console.log('GPS not available')
        }
      }

      // Insert tracking record
      await supabase.from('driver_tracking').insert({
        driver_id: user.id,
        tour_id: tourId,
        status: newStatus,
        current_step: step,
        location_lat: location?.lat,
        location_lng: location?.lng,
        recorded_at: new Date().toISOString()
      })

      // Update tour status
      if (newStatus === 'picked_up') {
        await supabase.from('tours').update({ 
          status: 'in_progress',
          actual_departure: new Date().toISOString()
        }).eq('id', tourId)
      } else if (newStatus === 'completed') {
        await supabase.from('tours').update({ 
          status: 'completed',
          actual_arrival: new Date().toISOString()
        }).eq('id', tourId)
      }

      setTransfer(prev => prev ? { ...prev, status: newStatus, current_step: step } : null)

    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">❌</div>
        <h2 className="text-lg font-semibold">Transfer not found</h2>
        <Link href="/driver" className="text-blue-600 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const steps = [
    { key: 'vehicle_checked', label: t('driver.steps.vehicleChecked'), icon: '✓' },
    { key: 'en_route_pickup', label: t('driver.steps.enRoutePickup'), icon: '🚗' },
    { key: 'picked_up', label: t('driver.steps.pickedUp'), icon: '👥' },
    { key: 'en_route_dropoff', label: t('driver.steps.enRouteDropoff'), icon: '🛣️' },
    { key: 'completed', label: t('driver.steps.completed'), icon: '🏁' }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === transfer.status)

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/driver" className="text-gray-500 hover:text-gray-700">
          ← {t('common.back')}
        </Link>
        <span className="text-sm text-gray-500">Transfer</span>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                idx <= currentStepIndex 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {idx < currentStepIndex ? '✓' : step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 w-8 mt-2 ${
                  idx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center font-medium text-blue-600">
          {steps[currentStepIndex]?.label}
        </p>
      </div>

      {/* Transfer Info */}
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">{transfer.name}</h1>
        <p className="text-gray-500 text-sm mb-4">{transfer.vehicle_plate}</p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-600 mt-1">📍</span>
            <div>
              <div className="text-xs text-gray-500 uppercase">{t('driver.pickup')}</div>
              <div className="font-medium">{transfer.pickup_location}</div>
              <div className="text-sm text-gray-500">{transfer.start_time?.slice(0, 5)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-red-600 mt-1">🏁</span>
            <div>
              <div className="text-xs text-gray-500 uppercase">{t('driver.dropoff')}</div>
              <div className="font-medium">{transfer.dropoff_location}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guests */}
      {transfer.guests.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">{t('driver.passengers')} ({transfer.guests.length})</h2>
          <div className="space-y-2">
            {transfer.guests.map(guest => (
              <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{guest.first_name} {guest.last_name}</div>
                  <div className="text-xs text-gray-500">
                    {guest.hotel} {guest.room_number && `• Room ${guest.room_number}`}
                  </div>
                </div>
                {guest.phone && (
                  <a href={`tel:${guest.phone}`} className="text-blue-600 text-xl">
                    📞
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {transfer.guests.reduce((sum, g) => sum + (g.adults || 1) + (g.children || 0), 0)} {t('driver.totalPassengers')}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
        {transfer.status === 'vehicle_checked' && (
          <button
            onClick={() => updateStatus('en_route_pickup', 2)}
            disabled={updating}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? t('common.updating') : `🚗 ${t('driver.actions.startPickup')}`}
          </button>
        )}

        {transfer.status === 'en_route_pickup' && (
          <button
            onClick={() => updateStatus('picked_up', 3)}
            disabled={updating}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? t('common.updating') : `👥 ${t('driver.actions.confirmPickup')}`}
          </button>
        )}

        {transfer.status === 'picked_up' && (
          <button
            onClick={() => updateStatus('en_route_dropoff', 4)}
            disabled={updating}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? t('common.updating') : `🛣️ ${t('driver.actions.startTransfer')}`}
          </button>
        )}

        {transfer.status === 'en_route_dropoff' && (
          <button
            onClick={() => updateStatus('completed', 5)}
            disabled={updating}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? t('common.updating') : `🏁 ${t('driver.actions.completeTransfer')}`}
          </button>
        )}

        {transfer.status === 'completed' && (
          <div className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-semibold text-lg text-center">
            ✓ {t('driver.transferComplete')}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TransferWorkflowPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <TransferWorkflowContent />
      </DriverNav>
    </RoleGuard>
  )
}
