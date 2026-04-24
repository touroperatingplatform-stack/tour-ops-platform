'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { useTranslation } from '@/lib/i18n/useTranslation'
import DriverNav from '@/components/navigation/DriverNav'

interface Tour {
  id: string
  name: string
  start_time: string
  pickup_location: string
}

function DriverCheckinContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTour, setSelectedTour] = useState<string>(tourId || '')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [inspection, setInspection] = useState({
    mileage_start: '',
    fuel_level_before: 'full',
    vehicle_condition: 'good',
    issues: '',
    inspection_data: {
      tires: 'ok',
      brakes: 'ok',
      lights: 'ok',
      ac: 'ok',
      cleanliness: 'good',
      safety_equipment: 'ok',
    },
  })

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('tours')
        .select('id, name, start_time, pickup_location')
        .eq('driver_id', user.id)
        .eq('tour_date', today)
        .neq('status', 'cancelled')
        .order('start_time')

      setTours(data || [])
    } catch (error) {
      console.error('Error loading tours:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTour) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get tour to get brand_id and vehicle_id
      const { data: tourData } = await supabase
        .from('tours')
        .select('brand_id, vehicle_id')
        .eq('id', selectedTour)
        .single()

      if (!tourData) {
        alert('Tour not found')
        setSubmitting(false)
        return
      }

      await supabase.from('driver_checkins').insert({
        driver_id: user.id,
        tour_id: selectedTour,
        brand_id: tourData.brand_id,
        vehicle_id: tourData.vehicle_id,
        mileage_start: parseInt(inspection.mileage_start) || 0,
        fuel_level_before: inspection.fuel_level_before,
        vehicle_condition: inspection.vehicle_condition,
        issues: inspection.issues,
        inspection_data: inspection.inspection_data,
      })

      window.location.href = '/driver'
    } catch (error) {
      console.error('Error submitting checkin:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <Link href="/driver" className="text-sm text-gray-500 hover:underline">
          ← {t('driver.backToDashboard')}
        </Link>
        <h1 className="text-xl font-bold mt-2">{t('driver.vehicleCheckin')}</h1>
        <p className="text-sm text-gray-500">{t('driver.preTourInspection')}</p>
      </div>

      {/* Tour Selection */}
      <div className="bg-white rounded-xl shadow p-4">
        <label className="block text-sm font-medium mb-2">{t('driver.tourAssignment')}</label>
        <select
          value={selectedTour}
          onChange={(e) => setSelectedTour(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        >
          <option value="">{t('driver.selectTour')}</option>
          {tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.start_time?.slice(0, 5)} - {tour.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inspection Form */}
      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <h2 className="font-semibold">{t('driver.inspection.title')}</h2>

        {/* Mileage Start */}
        <div>
          <label className="block text-sm font-medium mb-2">Mileage Start</label>
          <input
            type="number"
            value={inspection.mileage_start}
            onChange={(e) => setInspection({ ...inspection, mileage_start: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="e.g. 45234"
            required
          />
        </div>

        {/* Fuel Level Before */}
        <div>
          <label className="block text-sm font-medium mb-2">Fuel Level (Before)</label>
          <div className="grid grid-cols-5 gap-2">
            {['full', '3/4', '1/2', '1/4', 'empty'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setInspection({ ...inspection, fuel_level_before: level })}
                className={`p-3 rounded-lg border-2 text-center ${
                  inspection.fuel_level_before === level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-lg">{level === 'full' ? '⛽' : level === 'empty' ? '🔴' : level === '3/4' ? '🟢' : level === '1/2' ? '🟡' : '🟠'}</span>
                <span className="block text-xs mt-1">{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Condition */}
        <div>
          <label className="block text-sm font-medium mb-2">Overall Vehicle Condition</label>
          <div className="grid grid-cols-3 gap-2">
            {['good', 'fair', 'poor'].map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => setInspection({ ...inspection, vehicle_condition: condition })}
                className={`p-3 rounded-lg border-2 text-center ${
                  inspection.vehicle_condition === condition
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-sm capitalize">{condition}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inspection Checklist */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">Quick Inspection Checklist</h3>
          {Object.entries(inspection.inspection_data).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize text-gray-700">{key.replace('_', ' ')}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspection({ ...inspection, inspection_data: { ...inspection.inspection_data, [key]: 'ok' } })}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    value === 'ok' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setInspection({ ...inspection, inspection_data: { ...inspection.inspection_data, [key]: 'issue' } })}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    value === 'issue' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Issue
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Issues */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('driver.inspection.issues')}</label>
          <textarea
            value={inspection.issues}
            onChange={(e) => setInspection({ ...inspection, issues: e.target.value })}
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder={t('driver.inspection.issuesPlaceholder')}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !selectedTour}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t('driver.submitting') : t('driver.completeCheckin')}
        </button>
        <Link
          href="/driver"
          className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700"
        >
          {t('common.cancel')}
        </Link>
      </div>
    </form>
  )
}

export default function DriverCheckinPage() {
  return (
    <RoleGuard requiredRole="driver">
      <DriverNav>
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>}>
          <DriverCheckinContent />
        </Suspense>
      </DriverNav>
    </RoleGuard>
  )
}