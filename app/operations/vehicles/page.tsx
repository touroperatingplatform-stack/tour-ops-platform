'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { useTranslation } from '@/lib/i18n/useTranslation'
import VehicleEditModal from '../components/VehicleEditModal'
import VehicleAddModal from '../components/VehicleAddModal'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  plate_number: string
  capacity: number
  status: 'available' | 'in_use' | 'maintenance'
  mileage: number
  next_maintenance?: string
  owner_id?: string
  owner_name?: string
}

interface Stats {
  total: number
  available: number
  inUse: number
  maintenance: number
  external: number
  onTour: number
}

export default function OperationsVehiclesPage() {
  const { t } = useTranslation()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, inUse: 0, maintenance: 0, external: 0, onTour: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'in_use' | 'maintenance'>('all')
  const [filterCapacity, setFilterCapacity] = useState<number>(0)
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    setLoading(true)
    try {
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        setLoading(false)
        return
      }

      // Load vehicles filtered by company
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owner:owner_id (
            first_name,
            last_name
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      const formatted: Vehicle[] = (vehiclesData || []).map((v: any) => ({
        ...v,
        owner_name: v.owner ? `${v.owner.first_name || ''} ${v.owner.last_name || ''}`.trim() : undefined
      }))

      // Deduplicate by plate_number (keep first occurrence)
      const uniqueMap = new Map<string, Vehicle>()
      formatted.forEach(v => {
        if (!uniqueMap.has(v.plate_number)) {
          uniqueMap.set(v.plate_number, v)
        }
      })
      const uniqueVehicles = Array.from(uniqueMap.values())

      setVehicles(uniqueVehicles)

      // Count vehicles on tour today (unique vehicles, not tour count)
      const today = new Date().toISOString().split('T')[0]
      const { data: toursData } = await supabase
        .from('tours')
        .select('vehicle_id')
        .eq('tour_date', today)
        .neq('status', 'cancelled')
        .not('vehicle_id', 'is', null)

      const onTourCount = new Set(toursData?.map(t => t.vehicle_id) || []).size

      // Calculate stats
      const stats: Stats = {
        total: uniqueVehicles.length,
        available: uniqueVehicles.filter(v => v.status === 'available').length,
        inUse: uniqueVehicles.filter(v => v.status === 'in_use').length,
        maintenance: uniqueVehicles.filter(v => v.status === 'maintenance').length,
        external: uniqueVehicles.filter(v => v.owner_id).length,
        onTour: onTourCount
      }
      setStats(stats)
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      in_use: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.available}`}>
        {t(`vehicles.${status}`) || status}
      </span>
    )
  }

  function getCapacityBadge(capacity: number) {
    let colorClass = 'bg-blue-50 text-blue-700'
    if (capacity >= 15) colorClass = 'bg-blue-100 text-blue-800'
    else if (capacity >= 10) colorClass = 'bg-blue-50 text-blue-700'
    else colorClass = 'bg-gray-50 text-gray-600'

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {capacity} 👥
      </span>
    )
  }

  function filteredVehicles() {
    return vehicles.filter(v => {
      const matchesSearch = searchQuery === '' || 
        v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || v.status === filterStatus
      const matchesCapacity = filterCapacity === 0 || v.capacity >= filterCapacity

      return matchesSearch && matchesStatus && matchesCapacity
    })
  }

  function toggleSelectVehicle(id: string) {
    const newSelected = new Set(selectedVehicles)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVehicles(newSelected)
  }

  function toggleSelectAll() {
    const filtered = filteredVehicles()
    if (selectedVehicles.size === filtered.length) {
      setSelectedVehicles(new Set())
    } else {
      setSelectedVehicles(new Set(filtered.map(v => v.id)))
    }
  }

  async function bulkUpdateStatus(newStatus: 'available' | 'in_use' | 'maintenance') {
    if (selectedVehicles.size === 0) return

    const { error } = await supabase
      .from('vehicles')
      .update({ status: newStatus })
      .in('id', Array.from(selectedVehicles))

    if (error) {
      alert('Error updating vehicles: ' + error.message)
    } else {
      loadVehicles()
      setSelectedVehicles(new Set())
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
  }

  const filtered = filteredVehicles()

  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            <StatCard label={t('vehicles.total') || 'Total'} value={stats.total} onClick={() => setFilterStatus('all')} active={filterStatus === 'all'} />
            <StatCard label={t('vehicles.available') || 'Disponible'} value={stats.available} onClick={() => setFilterStatus('available')} active={filterStatus === 'available'} color="green" />
            <StatCard label={t('vehicles.inUse') || 'En Uso'} value={stats.inUse} onClick={() => setFilterStatus('in_use')} active={filterStatus === 'in_use'} color="blue" />
            <StatCard label={t('vehicles.maintenance') || 'Mantenimiento'} value={stats.maintenance} onClick={() => setFilterStatus('maintenance')} active={filterStatus === 'maintenance'} color="red" />
            <StatCard label={t('vehicles.external') || 'Externos'} value={stats.external} color="purple" />
            <StatCard label={t('vehicles.onTour') || 'En Tour'} value={stats.onTour} color="orange" />
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder={t('vehicles.searchPlaceholder') || 'Buscar placa, marca, modelo...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('common.all') || 'Todos'}</option>
                <option value="available">{t('vehicles.available') || 'Disponible'}</option>
                <option value="in_use">{t('vehicles.inUse') || 'En Uso'}</option>
                <option value="maintenance">{t('vehicles.maintenance') || 'Mantenimiento'}</option>
              </select>
              <select
                value={filterCapacity}
                onChange={(e) => setFilterCapacity(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">{t('vehicles.allCapacities') || 'Todas'}</option>
                <option value="10">10+ {t('vehicles.passengers')}</option>
                <option value="15">15+ {t('vehicles.passengers')}</option>
                <option value="20">20+ {t('vehicles.passengers')}</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + {t('vehicles.addVehicle') || 'Agregar Vehículo'}
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedVehicles.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedVehicles.size} {t('vehicles.selected') || 'seleccionados'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => bulkUpdateStatus('available')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  {t('vehicles.markAvailable') || 'Marcar Disponible'}
                </button>
                <button
                  onClick={() => bulkUpdateStatus('maintenance')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  {t('vehicles.markMaintenance') || 'Marcar Mantenimiento'}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>{t('vehicles.noVehicles') || 'No hay vehículos registrados'}</p>
              </div>
            ) : (
              <div className="max-h-[450px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.size === filtered.length && filtered.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('vehicles.vehicle')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('vehicles.plate')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('vehicles.capacity')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('common.status')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('vehicles.owner')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.has(vehicle.id)}
                            onChange={() => toggleSelectVehicle(vehicle.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-gray-500">{vehicle.year}</p>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => copyToClipboard(vehicle.plate_number)}
                            className="text-gray-600 font-mono text-sm hover:text-blue-600 hover:underline"
                            title="Click to copy"
                          >
                            {vehicle.plate_number}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {getCapacityBadge(vehicle.capacity)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(vehicle.status)}
                        </td>
                        <td className="py-3 px-4">
                          {vehicle.owner_name ? (
                            <span className="text-xs text-purple-600 font-medium">👤 {vehicle.owner_name}</span>
                          ) : (
                            <span className="text-xs text-gray-400">🏢 {t('vehicles.company') || 'Empresa'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setEditingVehicle(vehicle)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                          >
                            {t('common.edit')}
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 text-lg">⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {editingVehicle && (
          <VehicleEditModal
            vehicle={editingVehicle}
            onClose={() => setEditingVehicle(null)}
            onSave={() => {
              loadVehicles()
              setEditingVehicle(null)
            }}
          />
        )}
        {showAddModal && (
          <VehicleAddModal
            onClose={() => setShowAddModal(false)}
            onSave={() => {
              loadVehicles()
              setShowAddModal(false)
            }}
          />
        )}
      </div>
    </RoleGuard>
  )
}

function StatCard({ label, value, onClick, active, color = 'gray' }: { 
  label: string; 
  value: number; 
  onClick?: () => void;
  active?: boolean;
  color?: 'gray' | 'green' | 'blue' | 'red' | 'purple' | 'orange';
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900'
  }

  const activeClass = active ? 'ring-2 ring-blue-500 border-blue-500' : ''

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} ${activeClass} border rounded-lg p-3 text-center hover:opacity-80 transition-opacity w-full`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </button>
  )
}
