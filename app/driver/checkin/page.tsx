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
    mileage: '',
    fuel_level: 'full',
    exterior_condition: 'good',
    interior_condition: 'good',
    issues: '',
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

      await supabase.from('driver_checkins').insert({
        driver_id: user.id,
        tour_id: selectedTour,
        mileage: parseInt(inspection.mileage) || 0,
        fuel_level: inspection.fuel_level,
        exterior_condition: inspection.exterior_condition,
        interior_condition: inspection.interior_condition,
        issues: inspection.issues,
        tour_date: new Date().toISOString().split('T')[0],
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

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('driver.inspection.mileage')}</label>
          <input
            type="number"
            value={inspection.mileage}
            onChange={(e) => setInspection({ ...inspection, mileage: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="e.g. 45234"
            required
          />
        </div>

        {/* Fuel Level */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('driver.fuel.level')}</label>
          <div className="grid grid-cols-4 gap-2">
            {['full', '3/4', '1/2', '1/4'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setInspection({ ...inspection, fuel_level: level })}
                className={`p-3 rounded-lg border-2 text-center ${
                  inspection.fuel_level === level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-lg">{level === 'full' ? '⛽' : level === '3/4' ? '🟢' : level === '1/2' ? '🟡' : '🔴'}</span>
                <span className="block text-xs mt-1">{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exterior Condition */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('driver.condition.exterior')}</label>
          <div className="grid grid-cols-3 gap-2">
            {['good', 'fair', 'needs_attention'].map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => setInspection({ ...inspection, exterior_condition: condition })}
                className={`p-3 rounded-lg border-2 text-center ${
                  inspection.exterior_condition === condition
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-sm">{t(`driver.status.${condition}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interior Condition */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('driver.condition.interior')}</label>
          <div className="grid grid-cols-3 gap-2">
            {['good', 'fair', 'needs_attention'].map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => setInspection({ ...inspection, interior_condition: condition })}
                className={`p-3 rounded-lg border-2 text-center ${
                  inspection.interior_condition === condition
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-sm">{t(`driver.status.${condition}`)}</span>
              </button>
            ))}
          </div>
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