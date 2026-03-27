'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  plate_number: string
  capacity: number
  status: 'available' | 'in_use' | 'maintenance'
  assigned_guide?: string
}

// Operations vehicles fleet management
export default function OperationsVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at')
    
    if (!error) {
      setVehicles(data || [])
    }
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      in_use: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      available: 'Available',
      in_use: 'In Use',
      maintenance: 'Maintenance'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.available}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + Add Vehicle
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {vehicles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No vehicles yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Plate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Capacity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-gray-500">{vehicle.year}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600 font-mono">{vehicle.plate_number}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">{vehicle.capacity} passengers</p>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(vehicle.status)}
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
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
