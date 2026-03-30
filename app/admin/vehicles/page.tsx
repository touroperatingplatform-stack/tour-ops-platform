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
  year: number
  capacity: number
  status: 'available' | 'in_use' | 'maintenance'
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model, year, capacity, status')
      .order('plate_number')

    if (error) {
      console.error('Error loading vehicles:', error)
    } else {
      setVehicles(data || [])
      setStats({
        total: data?.length || 0,
        available: data?.filter((v: Vehicle) => v.status === 'available').length || 0,
        inUse: data?.filter((v: Vehicle) => v.status === 'in_use').length || 0
      })
    }
    setLoading(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700'
      case 'in_use': return 'bg-blue-100 text-blue-700'
      case 'maintenance': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'available': return 'Ready'
      case 'in_use': return 'On Tour'
      case 'maintenance': return 'Service'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading fleet...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Fleet</h1>
            <p className="text-gray-500 text-sm">Manage vehicles</p>
          </div>
          <Link 
            href="/admin/vehicles/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-gray-500 text-xs">Ready</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
            <div className="text-gray-500 text-xs">On Tour</div>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 px-4 pb-20 overflow-y-auto">
        <div className="space-y-2">
          {vehicles.map(vehicle => (
            <Link
              key={vehicle.id}
              href={`/admin/vehicles/${vehicle.id}`}
              className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  🚌
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{vehicle.plate_number}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">{vehicle.capacity} seats</div>
                  <div className="text-gray-400 text-xs">→</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0 fixed bottom-0 left-0 right-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/admin/vehicles" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">🚗</span>
            <span className="text-xs">Fleet</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
