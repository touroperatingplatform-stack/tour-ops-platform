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
  vehicle_plate: string
}

function CheckinContent() {
  const { t } = useTranslation()
  const params = useParams()
  const tourId = params.id as string
  
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('full')
  const [issues, setIssues] = useState('')

  useEffect(() => {
    if (tourId) loadTour()
  }, [tourId])

  async function loadTour() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tourData } = await supabase
        .from('tours')
        .select('id, name, vehicles!vehicle_id (plate_number)')
        .eq('id', tourId)
        .eq('driver_id', user.id)
        .single()

      if (tourData) {
        setTour({
          ...tourData,
          vehicle_plate: tourData.vehicles?.plate_number || 'Unknown'
        })
      }
    } catch (error) {
      console.error('Error loading tour:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create checkin record
      await supabase.from('driver_checkins').insert({
        driver_id: user.id,
        tour_id: tourId,
        mileage: parseInt(mileage) || 0,
        fuel_level: fuelLevel,
        issues: issues || null,
        status: 'completed'
      })

      // Update tour to in_progress
      await supabase.from('tours').update({
        status: 'in_progress'
      }).eq('id', tourId)

    } catch (error) {
      console.error('Error saving checkin:', error)
    } finally {
      setSaving(false)
      window.location.href = `/driver/tours/${tourId}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/driver/tours/${tourId}`} className="text-gray-500 hover:text-gray-700">
          ← {t('common.back')}
        </Link>
        <span className="text-sm text-gray-500">Pre-Trip Check-in</span>
      </div>

      {/* Tour Info */}
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">{tour?.name}</h1>
        <p className="text-gray-500 text-sm">{tour?.vehicle_plate}</p>
      </div>

      {/* Checkin Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Mileage (km) *</label>
          <input
            type="number"
            required
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., 45234"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Level *</label>
          <select
            required
            value={fuelLevel}
            onChange={(e) => setFuelLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="full">Full Tank</option>
            <option value="3/4">3/4 Tank</option>
            <option value="1/2">1/2 Tank</option>
            <option value="1/4">1/4 Tank</option>
            <option value="empty">Empty</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issues / Notes</label>
          <textarea
            rows={3}
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Any vehicle issues or notes..."
          />
        </div>

        <button
          type="submit"
          disabled={saving || !mileage}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : '✓ Complete Check-in'}
        </button>
      </form>
    </div>
  )
}

export default function CheckinPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <CheckinContent />
      </DriverNav>
    </RoleGuard>
  )
}
