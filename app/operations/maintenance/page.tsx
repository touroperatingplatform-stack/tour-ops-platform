'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const maintenanceTypes = [
  { value: 'oil_change', label: 'Oil Change', icon: '🛢️' },
  { value: 'tire_rotation', label: 'Tire Rotation', icon: '🔄' },
  { value: 'inspection', label: 'Inspection', icon: '📋' },
  { value: 'repair', label: 'Repair', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📝' },
]

export default function VehicleMaintenancePage() {
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: maint } = await supabase
      .from('vehicle_maintenance')
      .select(`
        *,
        vehicle:vehicles(plate_number, make, model)
      `)
      .order('scheduled_date', { ascending: true })

    const { data: veh } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .order('plate_number')

    setMaintenance(maint || [])
    setVehicles(veh || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase
      .from('vehicle_maintenance')
      .update({ status, completed_date: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', id)
    
    loadData()
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>

  const upcoming = maintenance.filter(m => m.status === 'scheduled')
  const inProgress = maintenance.filter(m => m.status === 'in_progress')
  const completed = maintenance.filter(m => m.status === 'completed')

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Vehicle Maintenance</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          + Schedule
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{upcoming.length}</p>
          <p className="text-xs text-yellow-600">Upcoming</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{inProgress.length}</p>
          <p className="text-xs text-blue-600">In Progress</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{completed.length}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MaintenanceCard key={m.id} item={m} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">In Progress</h2>
          <div className="space-y-2">
            {inProgress.map((m) => (
              <MaintenanceCard key={m.id} item={m} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">Recently Completed</h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map((m) => (
              <MaintenanceCard key={m.id} item={m} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <MaintenanceForm
          vehicles={vehicles}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

function MaintenanceCard({ item, onUpdateStatus }: any) {
  const type = maintenanceTypes.find(t => t.value === item.type)
  
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{type?.icon}</span>
            <div>
              <p className="font-medium">{item.vehicle?.plate_number}</p>
              <p className="text-sm text-gray-500">{type?.label} - {item.description}</p>
              {item.scheduled_date && (
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(item.scheduled_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {item.status === 'scheduled' && (
            <button
              onClick={() => onUpdateStatus(item.id, 'in_progress')}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              Start
            </button>
          )}
          {item.status === 'in_progress' && (
            <button
              onClick={() => onUpdateStatus(item.id, 'completed')}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MaintenanceForm({ vehicles, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: 'inspection',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: '',
    mileage: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('vehicle_maintenance')
      .insert({
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        description: formData.description,
        scheduled_date: formData.scheduled_date,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        notes: formData.notes || null,
        status: 'scheduled',
      })

    setLoading(false)
    if (!error) onSuccess()
    else alert('Failed: ' + error.message)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-4">
        <h2 className="text-lg font-bold mb-4">Schedule Maintenance</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={formData.vehicle_id}
            onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
            ))}
          </select>

          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {maintenanceTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />

          <input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Cost ($)"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Mileage"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
