'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

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

export default function DriverCheckinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tourIdFromUrl = searchParams.get('tour_id')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedTour, setSelectedTour] = useState<string>('')
  const [vehicle, setVehicle] = useState<Tour['vehicles'] | null>(null)

  // Form state
  const [mileageStart, setMileageStart] = useState('')
  const [fuelLevelBefore, setFuelLevelBefore] = useState('')
  const [vehicleCondition, setVehicleCondition] = useState('good')
  const [issues, setIssues] = useState('')
  
  // Inspection checklist
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
        // vehicles is array from Supabase join, take first item
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

      // Supabase returns vehicles as array from join, normalize to single object
      const formattedTours = (data || []).map((t: any) => ({
        ...t,
        vehicles: Array.isArray(t.vehicles) ? t.vehicles[0] : t.vehicles
      }))
      
      setTours(formattedTours)
      
      // Use formattedTours (already normalized), not raw data
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

      // Get vehicle_id directly from tour (not from vehicles object)
      const { error } = await supabase
        .from('driver_checkins')
        .insert({
          tour_id: selectedTour,
          driver_id: user.id,
          vehicle_id: tour.vehicle_id,
          mileage_start: mileageStart ? parseInt(mileageStart) : null,
          fuel_level_before: fuelLevelBefore || null,
          vehicle_condition,
          issues: issues || null,
          inspection_data: inspection
        })

      if (error) throw error

      alert('✅ Vehicle check-in completed!')
      router.push('/driver')
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole="driver">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/driver" className="text-sm text-gray-500 hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Vehicle Check-in</h1>
            <p className="text-sm text-gray-500">Pre-tour vehicle inspection</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tour Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Assignment</h2>
              
              {tours.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tour
                  </label>
                  <select
                    value={selectedTour}
                    onChange={(e) => {
                      setSelectedTour(e.target.value)
                      const tour = tours.find(t => t.id === e.target.value)
                      setVehicle(tour?.vehicles || null)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a tour...</option>
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
                    ⚠️ No tours assigned to you. Contact operations if you should have an assignment.
                  </p>
                </div>
              )}

              {vehicle && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900">{vehicle.model}</p>
                  <p className="text-sm text-gray-600">🚗 {vehicle.plate_number}</p>
                  <p className="text-sm text-gray-600">👥 {vehicle.capacity} passengers</p>
                </div>
              )}
            </div>

            {/* Mileage & Fuel */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mileage & Fuel</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={mileageStart}
                    onChange={(e) => setMileageStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 45230"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Level (Before)
                  </label>
                  <select
                    value={fuelLevelBefore}
                    onChange={(e) => setFuelLevelBefore(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select fuel level...</option>
                    <option value="empty">Empty</option>
                    <option value="1/4">1/4 Tank</option>
                    <option value="1/2">1/2 Tank</option>
                    <option value="3/4">3/4 Tank</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inspection Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Inspection</h2>
              
              <div className="space-y-3">
                {[
                  { key: 'tires', label: 'Tires (pressure, tread, damage)' },
                  { key: 'brakes', label: 'Brakes (responsive, no noise)' },
                  { key: 'lights', label: 'Lights (headlights, brake lights, signals)' },
                  { key: 'ac', label: 'A/C (working properly)' },
                  { key: 'cleanliness', label: 'Cleanliness (interior/exterior)' },
                  { key: 'first_aid', label: 'First Aid Kit (present, complete)' },
                  { key: 'fire_extinguisher', label: 'Fire Extinguisher (present, valid)' }
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
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </>
                      ) : (
                        <>
                          <option value="ok">OK</option>
                          <option value="issue">Issue</option>
                        </>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Condition & Issues */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Assessment</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Condition
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'good', label: '✅ Good', color: 'bg-green-100 border-green-300 text-green-800' },
                    { value: 'fair', label: '⚠️ Fair', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
                    { value: 'poor', label: '❌ Poor', color: 'bg-red-100 border-red-300 text-red-800' }
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 cursor-pointer border-2 rounded-lg px-4 py-3 text-center font-medium transition-all ${
                        vehicleCondition === opt.value
                          ? opt.color + ' border-current'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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
                  Issues / Notes (optional)
                </label>
                <textarea
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe any issues found during inspection..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Report any damage, maintenance needs, or cleanliness issues
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedTour}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Complete Check-in'}
              </button>
              <Link
                href="/driver"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  )
}
