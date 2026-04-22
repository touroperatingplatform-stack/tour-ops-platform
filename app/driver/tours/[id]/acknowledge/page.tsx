'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  acknowledged_at: string | null
  vehicle_id: string | null
  vehicles?: { plate_number: string; model: string }
}

interface Stop {
  id: string
  location_name: string
  scheduled_time: string
  guest_count: number
  stop_type: 'pickup' | 'activity' | 'dropoff'
  sort_order: number
}

interface Profile {
  full_name: string
  phone: string
}

function AcknowledgeContent() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const [tour, setTour] = useState<Tour | null>(null)
  const [pickupStops, setPickupStops] = useState<Stop[]>([])
  const [activityStops, setActivityStops] = useState<Stop[]>([])
  const [dropoffStops, setDropoffStops] = useState<Stop[]>([])
  const [supervisor, setSupervisor] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [officeArrivalTime, setOfficeArrivalTime] = useState('')
  const [pickupStartTime, setPickupStartTime] = useState('')
  const [vanConfirmed, setVanConfirmed] = useState(false)

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('*, vehicles(plate_number, model)')
      .eq('id', params.id)
      .single()

    if (tourData) {
      setTour(tourData)
      
      const [hours, minutes] = tourData.start_time.split(':').map(Number)
      const pickupDate = new Date()
      pickupDate.setHours(hours, minutes, 0)
      pickupDate.setMinutes(pickupDate.getMinutes() - 20)
      
      const defaultPickup = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      pickupDate.setMinutes(pickupDate.getMinutes() - 30)
      const defaultOffice = `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}`
      
      setPickupStartTime(tourData.confirmed_pickup_time || defaultPickup)
      setOfficeArrivalTime(tourData.confirmed_office_arrival_time || defaultOffice)
      
      const { data: allStops } = await supabase
        .from('pickup_stops')
        .select('id, location_name, scheduled_time, guest_count, stop_type, sort_order')
        .eq('tour_id', params.id)
        .order('sort_order')
      
      if (allStops) {
        setPickupStops(allStops.filter(s => s.stop_type === 'pickup'))
        setActivityStops(allStops.filter(s => s.stop_type === 'activity'))
        setDropoffStops(allStops.filter(s => s.stop_type === 'dropoff'))
      }

      const { data: brandAdmins } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('brand_id', tourData.brand_id)
        .eq('role', 'admin')
        .limit(1)
      
      if (brandAdmins && brandAdmins.length > 0) {
        setSupervisor(brandAdmins[0])
      }
    }
    setLoading(false)
  }

  async function handleAcknowledge() {
    if (!officeArrivalTime || !pickupStartTime || !vanConfirmed) {
      alert('Please confirm all items')
      return
    }

    setSubmitting(true)
    
    const { data, error } = await supabase
      .from('tours')
      .update({
        acknowledged_at: new Date().toISOString(),
        confirmed_office_arrival_time: officeArrivalTime,
        confirmed_pickup_time: pickupStartTime
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Acknowledge error:', error)
      alert('Failed to acknowledge tour: ' + error.message)
      setSubmitting(false)
      return
    }

    console.log('Tour acknowledged:', data)
    router.push('/driver')
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

  if (tour.acknowledged_at) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-lg font-semibold">Tour Already Acknowledged</h2>
        <Link href={`/driver/tours/${params.id}`} className="text-blue-600 mt-2 inline-block">← Back to Tour</Link>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/driver/tours/${params.id}`} className="text-gray-500 hover:text-gray-700">← {t('common.back')}</Link>
        <span className="text-sm text-gray-500">Acknowledge Tour</span>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">{tour.name}</h1>
        <p className="text-gray-500 text-sm mb-4">{tour.vehicles?.plate_number || 'Unknown Vehicle'}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Office Arrival Time</label>
          <input
            type="time"
            value={officeArrivalTime}
            onChange={(e) => setOfficeArrivalTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Start Time</label>
          <input
            type="time"
            value={pickupStartTime}
            onChange={(e) => setPickupStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={vanConfirmed}
            onChange={(e) => setVanConfirmed(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="font-medium">I have confirmed the vehicle assignment</span>
        </label>

        {supervisor && (
          <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
            <div className="font-medium">Supervisor:</div>
            <div>{supervisor.full_name}</div>
            <a href={`tel:${supervisor.phone}`} className="text-blue-600">{supervisor.phone}</a>
          </div>
        )}

        <button
          onClick={handleAcknowledge}
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Acknowledging...' : '✓ Acknowledge Tour'}
        </button>
      </div>
    </div>
  )
}

export default function AcknowledgePage() {
  return (
    <DriverNav>
      <AcknowledgeContent />
    </DriverNav>
  )
}
