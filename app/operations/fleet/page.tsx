'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function OperationsFleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .order('plate_number')

      setVehicles(data || [])
      setLoading(false)
    }
    loadVehicles()
  }, [])

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Loading fleet...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Fleet Status</h1>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-green-700">{vehicles.filter(v => v.status === 'available').length}</p>
          <p className="text-sm text-green-600">Available</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-blue-700">{vehicles.filter(v => v.status === 'in_use').length}</p>
          <p className="text-sm text-blue-600">In Use</p>
        </div>
      </div>

      <div className="space-y-2">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{vehicle.plate_number}</p>
                <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                vehicle.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {vehicle.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
