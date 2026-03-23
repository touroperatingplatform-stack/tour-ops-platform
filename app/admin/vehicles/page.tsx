'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Vehicle {
  id: string
  brand_id: string
  plate_number: string
  make: string
  model: string
  year: number
  capacity: number
  is_active: boolean
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const { data, error } = await (supabase as any)
      .from('vehicles')
      .select('*')
      .order('plate_number')

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-500 mt-1">Manage tour vehicles</p>
        </div>
        <Link
          href="/admin/vehicles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add Vehicle</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No vehicles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Plate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Make/Model</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{vehicle.plate_number}</td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.make} {vehicle.model}</td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.year}</td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.capacity} seats</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vehicle.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {vehicles.length} vehicles
      </div>
    </div>
  )
}
