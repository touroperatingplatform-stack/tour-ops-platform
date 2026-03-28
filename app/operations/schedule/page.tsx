'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { useTranslation } from '@/lib/i18n/useTranslation'
import TourDetailsModal from '../components/TourDetailsModal'
import TourAddModal from '../components/TourAddModal'

interface Tour {
  id: string
  name: string
  tour_date: string
  start_time: string
  status: string
  guide_name: string
  guide_id?: string
  guide_phone?: string
  driver_name?: string
  driver_id?: string
  driver_phone?: string
  vehicle_plate?: string
  vehicle_id?: string
  guest_count: number
  capacity: number
  pickup_location?: string
  dropoff_location?: string
  notes?: string
  payment_status?: string
  has_incident?: boolean
  guide_checked_in?: boolean
}

interface Driver {
  id: string
  name: string
  type: string
  phone?: string
  available: boolean
}

interface Vehicle {
  id: string
  plate: string
  capacity: number
  make: string
  model: string
  available: boolean
}

interface Stats {
  total: number
  scheduled: number
  inProgress: number
  completed: number
  delayed: number
  totalGuests: number
  needsDriver: number
  needsVehicle: number
}

export default function OperationsSchedulePage() {
  const { t } = useTranslation()
  const [tours, setTours] = useState<Tour[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'delayed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'drivers' | 'vehicles'>('drivers')
  const pollIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadData()
    // Poll every 30 seconds for real-time updates
    pollIntervalRef.current = setInterval(loadData, 30000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [selectedDate])

  async function loadData() {
    setLoading(true)
    try {
      // Load tours
      const { data: toursData, error: toursError } = await supabase
        .from('tours')
        .select(`
          id,
          name,
          tour_date,
          start_time,
          status,
          guest_count,
          capacity,
          guide_id,
          driver_id,
          vehicle_id,
          pickup_location,
          dropoff_location,
          notes,
          price,
          guide:guide_id (
            id,
            first_name,
            last_name,
            phone
          ),
          driver:driver_id (
            id,
            first_name,
            last_name,
            phone
          ),
          vehicle:vehicle_id (
            id,
            plate_number,
            capacity,
            make,
            model
          )
        `)
        .eq('tour_date', selectedDate)
        .neq('status', 'cancelled')
        .order('start_time')

      if (toursError) throw toursError

      // Load check-ins for guide status
      const { data: checkinsData } = await supabase
        .from('driver_checkins')
        .select('tour_id, driver_id')
        .eq('tour_id', toursData?.map(t => t.id) || ['00000000-0000-0000-0000-000000000000'])

      const checkedInTourIds = new Set(checkinsData?.map(c => c.tour_id) || [])

      // Load incidents for tours
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('tour_id')
        .in('tour_id', toursData?.map(t => t.id) || ['00000000-0000-0000-0000-000000000000'])
        .eq('status', 'reported')

      const incidentTourIds = new Set(incidentsData?.map(i => i.tour_id) || [])

      const formattedTours: Tour[] = (toursData || []).map((tour: any) => ({
        ...tour,
        guide_name: tour.guide ? `${tour.guide.first_name || ''} ${tour.guide.last_name || ''}`.trim() || 'Sin Asignar' : 'Sin Asignar',
        guide_phone: tour.guide?.phone,
        driver_name: tour.driver ? `${tour.driver.first_name || ''} ${tour.driver.last_name || ''}`.trim() : undefined,
        driver_phone: tour.driver?.phone,
        vehicle_plate: tour.vehicle?.plate_number,
        guide_checked_in: checkedInTourIds.has(tour.id),
        has_incident: incidentTourIds.has(tour.id),
        payment_status: tour.price ? 'paid' : 'pending'
      }))

      // Deduplicate by id
      const uniqueMap = new Map<string, Tour>()
      formattedTours.forEach((tour) => {
        if (!uniqueMap.has(tour.id)) {
          uniqueMap.set(tour.id, tour)
        }
      })
      setTours(Array.from(uniqueMap.values()))

      // Load available drivers
      const { data: driversData } = await supabase
        .from('driver_profiles')
        .select(`
          profile_id,
          driver_type,
          profiles (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('status', 'active')

      const formattedDrivers: Driver[] = (driversData || []).map((d: any) => ({
        id: d.profile_id,
        name: `${d.profiles.first_name || ''} ${d.profiles.last_name || ''}`.trim(),
        type: d.driver_type,
        phone: d.profiles.phone,
        available: !toursData?.some(t => t.driver_id === d.profile_id)
      }))

      // Deduplicate drivers
      const driverMap = new Map<string, Driver>()
      formattedDrivers.forEach(d => {
        if (!driverMap.has(d.id)) {
          driverMap.set(d.id, d)
        }
      })
      setDrivers(Array.from(driverMap.values()))

      // Load available vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')

      const formattedVehicles: Vehicle[] = (vehiclesData || []).map((v: any) => ({
        id: v.id,
        plate: v.plate_number,
        capacity: v.capacity,
        make: v.make,
        model: v.model,
        available: !toursData?.some(t => t.vehicle_id === v.id)
      }))
      setVehicles(formattedVehicles)

    } catch (error) {
      console.error('Error loading schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(tour: Tour) {
    const translations: Record<string, string> = {
      scheduled: t('tour.scheduled') || 'Programado',
      in_progress: t('tour.in_progress') || 'En Curso',
      completed: t('tour.completed') || 'Completado',
      delayed: t('tour.delayed') || 'Retrasado',
      departed: t('tour.departed') || 'Partió'
    }

    const styles: Record<string, string> = {
      scheduled: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      delayed: 'bg-yellow-100 text-yellow-700',
      departed: 'bg-purple-100 text-purple-700'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[tour.status] || styles.scheduled}`}>
        {translations[tour.status] || tour.status}
      </span>
    )
  }

  function getAlertBadge(tour: Tour) {
    if (!tour.driver_id) return { type: 'red', text: t('schedule.needsDriver') || 'Falta Chofer' }
    if (!tour.vehicle_id) return { type: 'orange', text: t('schedule.needsVehicle') || 'Falta Vehículo' }
    if (tour.has_incident) return { type: 'purple', text: t('schedule.hasIncident') || 'Con Incidente' }
    if (!tour.guide_checked_in && tour.status === 'in_progress') return { type: 'yellow', text: t('schedule.guideNotCheckedIn') || 'Guía no ha hecho check-in' }
    if (tour.guide_checked_in && tour.driver_id && tour.vehicle_id) return { type: 'green', text: '✓' }
    return null
  }

  function getStats(): Stats {
    return {
      total: tours.length,
      scheduled: tours.filter(t => t.status === 'scheduled').length,
      inProgress: tours.filter(t => t.status === 'in_progress').length,
      completed: tours.filter(t => t.status === 'completed').length,
      delayed: tours.filter(t => t.status === 'delayed').length,
      totalGuests: tours.reduce((sum, t) => sum + (t.guest_count || 0), 0),
      needsDriver: tours.filter(t => !t.driver_id).length,
      needsVehicle: tours.filter(t => !t.vehicle_id).length
    }
  }

  function filteredTours() {
    return tours.filter(tour => {
      const matchesStatus = filterStatus === 'all' || tour.status === filterStatus
      const matchesSearch = searchQuery === '' || 
        tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.guide_name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesSearch
    })
  }

  async function assignDriver(tourId: string, driverId: string) {
    const { error } = await supabase
      .from('tours')
      .update({ driver_id: driverId || null })
      .eq('id', tourId)

    if (error) {
      alert('Error assigning driver: ' + error.message)
    } else {
      loadData()
    }
  }

  async function assignVehicle(tourId: string, vehicleId: string) {
    const { error } = await supabase
      .from('tours')
      .update({ vehicle_id: vehicleId || null })
      .eq('id', tourId)

    if (error) {
      alert('Error assigning vehicle: ' + error.message)
    } else {
      loadData()
    }
  }

  async function updateTourStatus(tourId: string, newStatus: string) {
    const { error } = await supabase
      .from('tours')
      .update({ status: newStatus })
      .eq('id', tourId)

    if (error) {
      alert('Error updating status: ' + error.message)
    } else {
      loadData()
    }
  }

  const stats = getStats()
  const filtered = filteredTours()

  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setSidebarTab('drivers')}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded ${sidebarTab === 'drivers' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  👤 {t('nav.drivers')} ({drivers.filter(d => d.available).length})
                </button>
                <button
                  onClick={() => setSidebarTab('vehicles')}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded ${sidebarTab === 'vehicles' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  🚌 {t('nav.vehicles')} ({vehicles.filter(v => v.available).length})
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-2">
              {sidebarTab === 'drivers' ? (
                drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-2 mb-1 rounded border text-sm cursor-move hover:bg-gray-50 ${driver.available ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                    title={driver.phone}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⋮⋮</span>
                      <span className="flex-1 truncate">{driver.name}</span>
                      {driver.type === 'freelance' && <span className="text-xs text-purple-600">👤</span>}
                      {driver.phone && <a href={`tel:${driver.phone}`} className="text-gray-400 hover:text-blue-600">📞</a>}
                    </div>
                    <p className="text-xs text-gray-500 pl-6">{driver.available ? '✓ Disponible' : '🚌 Asignado'}</p>
                  </div>
                ))
              ) : (
                vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-2 mb-1 rounded border text-sm cursor-move hover:bg-gray-50 ${vehicle.available ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                    title={`${vehicle.make} ${vehicle.model}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⋮⋮</span>
                      <span className="flex-1 font-mono">{vehicle.plate}</span>
                      <span className="text-xs text-gray-500">{vehicle.capacity}👥</span>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">{vehicle.available ? '✓ Disponible' : '🚌 En Uso'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="self-start mb-2 text-xs text-gray-600 hover:text-blue-600"
            >
              {sidebarOpen ? '←' : '→'} {t('schedule.resources') || 'Recursos'}
            </button>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
              <StatCard label={t('schedule.total') || 'Total'} value={stats.total} onClick={() => setFilterStatus('all')} active={filterStatus === 'all'} />
              <StatCard label={t('tour.scheduled') || 'Programado'} value={stats.scheduled} onClick={() => setFilterStatus('scheduled')} active={filterStatus === 'scheduled'} color="gray" />
              <StatCard label={t('tour.in_progress') || 'En Curso'} value={stats.inProgress} onClick={() => setFilterStatus('in_progress')} active={filterStatus === 'in_progress'} color="blue" />
              <StatCard label={t('tour.completed') || 'Completado'} value={stats.completed} onClick={() => setFilterStatus('completed')} active={filterStatus === 'completed'} color="green" />
              <StatCard label={t('tour.delayed') || 'Retrasado'} value={stats.delayed} onClick={() => setFilterStatus('delayed')} active={filterStatus === 'delayed'} color="yellow" />
              <StatCard label={t('schedule.totalGuests') || 'Huéspedes'} value={stats.totalGuests} color="purple" />
              <StatCard label={t('schedule.needsDriver') || 'Sin Chofer'} value={stats.needsDriver} color="red" />
              <StatCard label={t('schedule.needsVehicle') || 'Sin Vehículo'} value={stats.needsVehicle} color="orange" />
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder={t('schedule.searchPlaceholder') || 'Buscar tour o guía...'}
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
                  <option value="scheduled">{t('tour.scheduled') || 'Programado'}</option>
                  <option value="in_progress">{t('tour.in_progress') || 'En Curso'}</option>
                  <option value="completed">{t('tour.completed') || 'Completado'}</option>
                  <option value="delayed">{t('tour.delayed') || 'Retrasado'}</option>
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  + {t('schedule.addTour') || 'Agregar Tour'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
              {loading ? (
                <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>{t('schedule.noTours') || 'No hay tours programados para esta fecha'}</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.time')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.tour')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.guide')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.driver')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.vehicle')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('common.status')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('schedule.guests')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtered.map((tour) => {
                        const alert = getAlertBadge(tour)
                        return (
                          <tr 
                            key={tour.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${alert?.type === 'red' ? 'border-l-4 border-l-red-500' : alert?.type === 'orange' ? 'border-l-4 border-l-orange-500' : ''}`}
                            onClick={() => setSelectedTour(tour)}
                          >
                            <td className="py-3 px-4">
                              <p className="font-mono text-sm font-medium text-gray-900">{tour.start_time}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900 text-sm">{tour.name}</p>
                              <p className="text-xs text-gray-500">Cap: {tour.capacity}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-700">{tour.guide_name}</p>
                                {tour.guide_phone && (
                                  <a href={`tel:${tour.guide_phone}`} className="text-gray-400 hover:text-blue-600 text-xs">📞</a>
                                )}
                                {tour.guide_checked_in && <span className="text-green-600 text-xs">✓</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {tour.driver_name ? (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-700">{tour.driver_name}</p>
                                  {tour.driver_phone && (
                                    <a href={`tel:${tour.driver_phone}`} className="text-gray-400 hover:text-blue-600 text-xs">📞</a>
                                  )}
                                </div>
                              ) : (
                                <select
                                  onClick={(e) => e.stopPropagation()}
                                  value=""
                                  onChange={(e) => assignDriver(tour.id, e.target.value)}
                                  className="text-xs border border-red-300 rounded px-2 py-1 bg-red-50 focus:ring-2 focus:ring-red-500"
                                >
                                  <option value="">+ {t('schedule.assignDriver') || 'Asignar'}</option>
                                  {drivers.filter(d => d.available).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {tour.vehicle_plate ? (
                                <p className="text-sm font-mono text-gray-600">{tour.vehicle_plate}</p>
                              ) : (
                                <select
                                  onClick={(e) => e.stopPropagation()}
                                  value=""
                                  onChange={(e) => assignVehicle(tour.id, e.target.value)}
                                  className="text-xs border border-orange-300 rounded px-2 py-1 bg-orange-50 focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">+ {t('schedule.assignVehicle') || 'Asignar'}</option>
                                  {vehicles.filter(v => v.available).map(v => (
                                    <option key={v.id} value={v.id}>{v.plate} ({v.capacity}👥)</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                onClick={(e) => e.stopPropagation()}
                                value={tour.status}
                                onChange={(e) => updateTourStatus(tour.id, e.target.value)}
                                className={`text-xs border rounded px-2 py-1 ${getStatusSelectClass(tour.status)}`}
                              >
                                <option value="scheduled">{t('tour.scheduled') || 'Programado'}</option>
                                <option value="in_progress">{t('tour.in_progress') || 'En Curso'}</option>
                                <option value="completed">{t('tour.completed') || 'Completado'}</option>
                                <option value="delayed">{t('tour.delayed') || 'Retrasado'}</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-700">
                                {tour.guest_count || 0} <span className="text-xs text-gray-500">/ {tour.capacity}</span>
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              {alert && (
                                <span className={`text-xs px-2 py-1 rounded-full ${getAlertClass(alert.type)}`}>
                                  {alert.text}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {selectedTour && (
          <TourDetailsModal
            tour={selectedTour}
            onClose={() => setSelectedTour(null)}
            onSave={loadData}
          />
        )}
        {showAddModal && (
          <TourAddModal
            selectedDate={selectedDate}
            onClose={() => setShowAddModal(false)}
            onSave={() => {
              loadData()
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
  color?: 'gray' | 'green' | 'blue' | 'red' | 'purple' | 'yellow' | 'orange';
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
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

function getStatusSelectClass(status: string): string {
  const classes: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-700 border-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    delayed: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  }
  return classes[status] || classes.scheduled
}

function getAlertClass(type: string): string {
  const classes: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700'
  }
  return classes[type] || classes.red
}
