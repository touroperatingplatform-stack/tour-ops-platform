'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string
  plate_number: string
  model: string
  year: number
  capacity: number
  status: 'active' | 'maintenance' | 'inactive'
  last_inspection: string | null
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-red-100 text-red-700',
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
          onClick={() => setFilter('active')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'active').length}</p>
          <p className="text-xs">Active</p>
        </button>
        <button
          onClick={() => setFilter('maintenance')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'maintenance' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'maintenance').length}</p>
          <p className="text-xs">Service</p>
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`rounded-2xl p-3 text-center transition-all ${
            filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'inactive').length}</p>
          <p className="text-xs">Inactive</p>
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
                <h3 className="font-semibold text-gray-900">{vehicle.model}</h3>
                <p className="text-sm text-gray-500">{vehicle.plate_number}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                {vehicle.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Year:</span>
                <span className="font-medium">{vehicle.year}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{vehicle.capacity} passengers</span>
              </div>
              {vehicle.last_inspection && (
                <div className="flex justify-between">
                  <span>Last inspection:</span>
                  <span className="font-medium">{new Date(vehicle.last_inspection).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
