'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function OperationsFleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabase
        .from('vehicles')
        .select(`
          *,
          current_tour:tours!vehicle_id(status, name, tour_date, guide:profiles(first_name, last_name))
        `)
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

  const filteredVehicles = filter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === filter)

  const available = vehicles.filter(v => v.status === 'available').length
  const inUse = vehicles.filter(v => v.status === 'in_use').length
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Fleet Status</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{available}</p>
          <p className="text-sm text-green-600">Available</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{inUse}</p>
          <p className="text-sm text-blue-600">In Use</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{maintenance}</p>
          <p className="text-sm text-orange-600">Maintenance</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'available', 'in_use', 'maintenance'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Vehicle List */}
      <div className="space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No vehicles found</div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{vehicle.plate_number}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                      vehicle.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                      vehicle.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</p>
                  
                  {/* Current Tour Info */}
                  {vehicle.status === 'in_use' && vehicle.current_tour && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium">On Tour: {vehicle.current_tour.name}</p>
                      {vehicle.current_tour.guide && (
                        <p className="text-xs text-blue-700">
                          Guide: {vehicle.current_tour.guide.first_name} {vehicle.current_tour.guide.last_name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Maintenance Alert */}
                  {vehicle.next_maintenance && (
                    <p className="text-xs text-orange-600 mt-1">
                      🔧 Service due: {new Date(vehicle.next_maintenance).toLocaleDateString()}
                    </p>
                  )}
                  
                  {vehicle.mileage && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mileage: {vehicle.mileage.toLocaleString()} km
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Capacity: {vehicle.capacity}</p>
                  <Link
                    href={`/admin/vehicles/${vehicle.id}`}
                    className="text-xs text-blue-600 underline mt-1 inline-block"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
