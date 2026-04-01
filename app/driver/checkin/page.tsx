'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import DriverNav from '@/components/navigation/DriverNav'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  vehicle_id: string
  vehicles: {
    plate_number: string
    model: string
    capacity: number
  } | null
}

function DriverCheckinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const tourIdFromUrl = searchParams.get('tour_id')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTour, setSelectedTour] = useState<string>('')
  const [vehicle, setVehicle] = useState<Tour['vehicles'] | null>(null)

  const [mileageStart, setMileageStart] = useState('')
  const [fuelLevelBefore, setFuelLevelBefore] = useState('')
  const [vehicleCondition, setVehicleCondition] = useState('good')
  const [issues, setIssues] = useState('')
  
  const [inspection, setInspection] = useState({
    tires: 'ok',
    brakes: 'ok',
    lights: 'ok',
    ac: 'ok',
    cleanliness: 'good',
    first_aid: 'ok',
    fire_extinguisher: 'ok'
  })

  useEffect(() => {
    loadAssignedTours()
  }, [])

  useEffect(() => {
    if (tourIdFromUrl) {
      setSelectedTour(tourIdFromUrl)
      const tour = tours.find(t => t.id === tourIdFromUrl)
      if (tour) {
        setVehicle(Array.isArray(tour.vehicles) ? tour.vehicles[0] : tour.vehicles)
      }
    }
  }, [tourIdFromUrl, tours])

  async function loadAssignedTours() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

      const { data } = await supabase
        .from('tours')
        .select(`
          id, name, tour_date, start_time, vehicle_id,
          vehicles (
            plate_number, model, capacity
          )
        `)
        .eq('driver_id', user.id)
        .in('tour_date', [today, tomorrow])
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })

      const formattedTours = (data || []).map((t: any) => ({
        ...t,
        vehicles: Array.isArray(t.vehicles) ? t.vehicles[0] : t.vehicles
      }))
      
      setTours(formattedTours)
      
      if (formattedTours.length > 0 && tourIdFromUrl) {
        const tour = formattedTours.find(t => t.id === tourIdFromUrl)
        if (tour) {
          setSelectedTour(tour.id)
          setVehicle(tour.vehicles)
        }
      }
    } catch (error) {
      console.error('Error loading tours:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !selectedTour) return

      const tour = tours.find(t => t.id === selectedTour)
      if (!tour) return

      const { error } = await supabase
        .from('driver_checkins')
        .insert({
          tour_id: selectedTour,
          driver_id: user.id,
          vehicle_id: tour.vehicle_id,
          mileage_start: mileageStart ? parseInt(mileageStart) : null,
          fuel_level_before: fuelLevelBefore || null,
          vehicle_condition: vehicleCondition,
          issues: issues || null,
          inspection_data: inspection
        })

      if (error) throw error

      router.push('/driver')
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole="driver">
      <DriverNav />
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white flex-shrink-0">
          <div className="px-4 py-3 border-8 border-transparent">
            <div className="px-4 py-3">
              <Link href="/driver" className="text-sm text-gray-500 hover:underline">
                ← {t('driver.backToDashboard')}
              </Link>
              <h1 className="text-xl font-bold mt-2">{t('driver.vehicleCheckin')}</h1>
              <p className="text-sm text-gray-500">{t('driver.preTourInspection')}</p>
            </div>
          </div>
        </header>

        {/* Form */}
        <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
          <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
            <div className="max-w-md mx-auto space-y-4">

              {/* Tour Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-semibold mb-3">{t('driver.tourAssignment')}</h2>
                
                {tours.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('driver.selectTour')}
                    </label>
                    <select
                      value={selectedTour}
                      onChange={(e) => {
                        setSelectedTour(e.target.value)
                        const tour = tours.find(t => t.id === e.target.value)
                        setVehicle(tour?.vehicles || null)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">{t('driver.chooseTour')}</option>
                      {tours.map(tour => (
                        <option key={tour.id} value={tour.id}>
                          {tour.name} - {tour.tour_date} {tour.start_time}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ {t('driver.noToursAssigned')}
                    </p>
                  </div>
                )}

                {vehicle && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{t('driver.vehicle')}</p>
                    <p className="font-medium">{vehicle.model}</p>
                    <p className="text-sm text-gray-600">🚗 {vehicle.plate_number}</p>
                    <p className="text-sm text-gray-600">👥 {vehicle.capacity} {t('driver.passengers')}</p>
                  </div>
                )}
              </div>

              {/* Mileage & Fuel */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-semibold mb-3">{t('driver.mileageFuel')}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('driver.startingMileage')}
                    </label>
                    <input
                      type="number"
                      value={mileageStart}
                      onChange={(e) => setMileageStart(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="45230"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('driver.fuelLevelBefore')}
                    </label>
                    <select
                      value={fuelLevelBefore}
                      onChange={(e) => setFuelLevelBefore(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">{t('driver.selectFuel')}</option>
                      <option value="empty">{t('driver.fuel.empty')}</option>
                      <option value="1/4">1/4</option>
                      <option value="1/2">1/2</option>
                      <option value="3/4">3/4</option>
                      <option value="full">{t('driver.fuel.full')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inspection */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-semibold mb-3">{t('driver.vehicleInspection')}</h2>
                
                <div className="space-y-3">
                  {[
                    { key: 'tires', label: t('driver.inspection.tires') },
                    { key: 'brakes', label: t('driver.inspection.brakes') },
                    { key: 'lights', label: t('driver.inspection.lights') },
                    { key: 'ac', label: t('driver.inspection.ac') },
                    { key: 'cleanliness', label: t('driver.inspection.cleanliness') },
                    { key: 'first_aid', label: t('driver.inspection.firstAid') },
                    { key: 'fire_extinguisher', label: t('driver.inspection.fireExtinguisher') }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <select
                        value={inspection[item.key as keyof typeof inspection]}
                        onChange={(e) => setInspection({ ...inspection, [item.key]: e.target.value })}
                        className={`border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 ${
                          inspection[item.key as keyof typeof inspection] === 'ok' || 
                          inspection[item.key as keyof typeof inspection] === 'good'
                            ? 'border-green-300 bg-green-50'
                            : 'border-red-300 bg-red-50'
                        }`}
                      >
                        {item.key === 'cleanliness' ? (
                          <>
                            <option value="good">{t('driver.status.good')}</option>
                            <option value="fair">{t('driver.status.fair')}</option>
                            <option value="poor">{t('driver.status.poor')}</option>
                          </>
                        ) : (
                          <>
                            <option value="ok">{t('driver.status.ok')}</option>
                            <option value="issue">{t('driver.status.issue')}</option>
                          </>
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-semibold mb-3">{t('driver.overallAssessment')}</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driver.vehicleCondition')}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'good', label: `✅ ${t('driver.status.good')}` },
                      { value: 'fair', label: `⚠️ ${t('driver.status.fair')}` },
                      { value: 'poor', label: `❌ ${t('driver.status.poor')}` }
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all ${
                          vehicleCondition === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={opt.value}
                          checked={vehicleCondition === opt.value}
                          onChange={(e) => setVehicleCondition(e.target.value)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('driver.issuesNotes')}
                  </label>
                  <textarea
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder={t('driver.describeIssues')}
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
            </div>
          </form>
        </main>
      </div>
    </RoleGuard>
  )
}

export default function DriverCheckinPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <DriverCheckinContent />
    </Suspense>
  )
}