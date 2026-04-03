'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Guide {
  id: string
  full_name: string
  email: string
}

interface Driver {
  id: string
  full_name: string
  email: string
}

interface Vehicle {
  id: string
  plate_number: string
  name: string | null
  capacity: number
}

export default function OnboardingTeam() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const [guides, setGuides] = useState<Guide[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleNames, setVehicleNames] = useState<Record<string, string>>({})
  const [vehicleCapacities, setVehicleCapacities] = useState<Record<string, number>>({})

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return

    setCompanyId(profile.company_id)

    // Load guides
    const { data: guideData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('company_id', profile.company_id)
      .eq('role', 'guide')
      .order('email')

    // Load drivers
    const { data: driverData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('company_id', profile.company_id)
      .eq('role', 'driver')
      .order('email')

    // Load vehicles
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('id, plate_number, name, capacity')
      .eq('company_id', profile.company_id)
      .order('plate_number')

    if (guideData) setGuides(guideData)
    if (driverData) setDrivers(driverData)
    if (vehicleData) {
      setVehicles(vehicleData)
      const names: Record<string, string> = {}
      const capacities: Record<string, number> = {}
      vehicleData.forEach(v => {
        names[v.id] = v.name || v.plate_number
        capacities[v.id] = v.capacity || 12
      })
      setVehicleNames(names)
      setVehicleCapacities(capacities)
    }

    setLoading(false)
  }

  function updateGuideName(id: string, full_name: string) {
    setGuides(prev => prev.map(g => g.id === id ? { ...g, full_name } : g))
  }

  function updateDriverName(id: string, full_name: string) {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, full_name } : d))
  }

  function updateVehicleName(id: string, name: string) {
    setVehicleNames(prev => ({ ...prev, [id]: name }))
  }

  function updateVehicleCapacity(id: string, capacity: number) {
    setVehicleCapacities(prev => ({ ...prev, [id]: capacity }))
  }

  async function handleNext() {
    setSaving(true)
    try {
      // Save guide names
      for (const guide of guides) {
        await supabase
          .from('profiles')
          .update({ full_name: guide.full_name })
          .eq('id', guide.id)
      }

      // Save driver names
      for (const driver of drivers) {
        await supabase
          .from('profiles')
          .update({ full_name: driver.full_name })
          .eq('id', driver.id)
      }

      // Save vehicle names and capacity
      for (const vehicle of vehicles) {
        await supabase
          .from('vehicles')
          .update({
            name: vehicleNames[vehicle.id] || vehicle.plate_number,
            capacity: vehicleCapacities[vehicle.id] || vehicle.capacity || 12
          })
          .eq('id', vehicle.id)
      }

      router.push('/admin/onboarding/tour')
    } catch (err) {
      console.error(err)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/admin/onboarding')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <span className="text-sm text-gray-500">Step 2 of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '66%' }}></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Name your team</h1>
          <p className="text-sm text-gray-500">Rename your guides, drivers, and vans (optional)</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Guides */}
        {guides.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🧑‍✈️</span> Guides
            </h2>
            <div className="space-y-3">
              {guides.map((guide, i) => (
                <div key={guide.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={guide.full_name}
                    onChange={(e) => updateGuideName(guide.id, e.target.value)}
                    placeholder="Guide name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400 flex-shrink-0">{guide.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drivers */}
        {drivers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🚗</span> Drivers
            </h2>
            <div className="space-y-3">
              {drivers.map((driver, i) => (
                <div key={driver.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={driver.full_name}
                    onChange={(e) => updateDriverName(driver.id, e.target.value)}
                    placeholder="Driver name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400 flex-shrink-0">{driver.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicles */}
        {vehicles.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🚐</span> Vans
            </h2>
            <div className="space-y-3">
              {vehicles.map((vehicle, i) => (
                <div key={vehicle.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={vehicleNames[vehicle.id] || ''}
                    onChange={(e) => updateVehicleName(vehicle.id, e.target.value)}
                    placeholder="Van name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={vehicleCapacities[vehicle.id] || ''}
                      onChange={(e) => updateVehicleCapacity(vehicle.id, parseInt(e.target.value) || 0)}
                      placeholder="Seats"
                      min="1"
                      max="50"
                      className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">seats</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{vehicle.plate_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 text-center">
          All fields are optional — click Next to skip
        </p>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleNext}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
