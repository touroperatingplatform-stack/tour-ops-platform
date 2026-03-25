'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string
  plate_number: string
  make: string
  model: string
  year: number | null
  capacity: number | null
  status: 'available' | 'maintenance' | 'unavailable'
  mileage: number | null
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  unavailable: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  maintenance: 'In Service',
  unavailable: 'Unavailable',
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading vehicles:', error)
    } else {
      setVehicles(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vehicles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet</h1>
          <p className="text-gray-500 mt-1">Manage vehicles and maintenance</p>
        </div>
        <Link
          href="/admin/vehicles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.length}</p>
          <p className="text-xs">Total</p>
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'available').length}</p>
          <p className="text-xs">Available</p>
        </button>
        <button
          onClick={() => setFilter('maintenance')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'maintenance' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'maintenance').length}</p>
          <p className="text-xs">In Service</p>
        </button>
        <button
          onClick={() => setFilter('unavailable')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'unavailable' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'unavailable').length}</p>
          <p className="text-xs">Unavailable</p>
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Link
            key={vehicle.id}
            href={`/admin/vehicles/${vehicle.id}`}
            className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-gray-500">{vehicle.plate_number}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                {statusLabels[vehicle.status]}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Year:</span>
                <span className="font-medium">{vehicle.year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{vehicle.capacity || 'N/A'} passengers</span>
              </div>
              <div className="flex justify-between">
                <span>Mileage:</span>
                <span className="font-medium">{vehicle.mileage?.toLocaleString() || 'N/A'} km</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
