'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Driver {
  id: string
  profile_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  license_number?: string
  license_expiry?: string
  driver_type: 'employee' | 'freelance'
  status: 'active' | 'inactive'
  hire_date?: string
  assigned_tours_count?: number
}

export default function AdminDriversManagement() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'employee' | 'freelance'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    driver_type: 'employee' as 'employee' | 'freelance',
    hire_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  async function loadDrivers() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const companyId = profile?.company_id
      if (!companyId) return

      const { data } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          profile_id,
          license_number,
          license_expiry,
          driver_type,
          status,
          hire_date,
          profiles (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      const today = getLocalDate()

      const { data: assignments } = await supabase
        .from('tours')
        .select('driver_id')
        .eq('tour_date', today)
        .neq('status', 'cancelled')

      const assignmentCount: Record<string, number> = {}
      assignments?.forEach((a: any) => {
        if (a.driver_id) {
          assignmentCount[a.driver_id] = (assignmentCount[a.driver_id] || 0) + 1
        }
      })

      const formatted: Driver[] = (data || []).map((d: any) => ({
        id: d.id,
        profile_id: d.profile_id,
        first_name: d.profiles.first_name,
        last_name: d.profiles.last_name,
        email: d.profiles.email,
        phone: d.profiles.phone,
        license_number: d.license_number || undefined,
        license_expiry: d.license_expiry || undefined,
        driver_type: d.driver_type,
        status: d.status,
        hire_date: d.hire_date || undefined,
        assigned_tours_count: assignmentCount[d.profile_id] || 0
      }))

      // Deduplicate by profile_id
      const uniqueMap = new Map<string, Driver>()
      formatted.forEach((d) => {
        if (!uniqueMap.has(d.profile_id)) {
          uniqueMap.set(d.profile_id, d)
        }
      })
      setDrivers(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error('Error loading drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDriver(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'driver',
          status: 'active',
          company_id: profile?.company_id
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Create driver profile
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .insert({
          profile_id: profileData.id,
          company_id: profile?.company_id,
          license_number: formData.license_number,
          license_expiry: formData.license_expiry || null,
          driver_type: formData.driver_type,
          hire_date: formData.hire_date,
          status: 'active'
        })

      if (driverError) throw driverError

      setShowAddModal(false)
      resetForm()
      loadDrivers()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateDriver(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDriver) return

    setSaving(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('id', editingDriver.profile_id)

      if (profileError) throw profileError

      // Update driver profile
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .update({
          license_number: formData.license_number,
          license_expiry: formData.license_expiry || null,
          driver_type: formData.driver_type
        })
        .eq('id', editingDriver.id)

      if (driverError) throw driverError

      setEditingDriver(null)
      resetForm()
      loadDrivers()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleDriverStatus(driver: Driver) {
    try {
      const newStatus = driver.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('driver_profiles')
        .update({ status: newStatus })
        .eq('id', driver.id)

      if (error) throw error
      loadDrivers()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      driver_type: 'employee',
      hire_date: new Date().toISOString().split('T')[0]
    })
  }

  const filteredDrivers = drivers.filter(d => {
    if (filterType !== 'all' && d.driver_type !== filterType) return false
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        d.first_name.toLowerCase().includes(q) ||
        d.last_name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.license_number || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  function openEditModal(driver: Driver) {
    setEditingDriver(driver)
    setFormData({
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email,
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry || '',
      driver_type: driver.driver_type,
      hire_date: driver.hire_date || new Date().toISOString().split('T')[0]
    })
  }

  if (loading) {
    return (
      <RoleGuard requiredRole="company_admin">
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="company_admin">
      <div className="h-full border-8 border-transparent">
        <div className="h-full flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('drivers.title') || 'Drivers'}</h1>
              <p className="text-sm text-gray-500">{t('drivers.subtitle') || 'Manage drivers, licenses, and assignments'}</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              + {t('drivers.addDriver') || 'Add Driver'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold">{drivers.length}</p>
              <p className="text-sm text-gray-500">{t('drivers.totalDrivers') || 'Total Drivers'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{drivers.filter(d => d.status === 'active').length}</p>
              <p className="text-sm text-gray-500">{t('common.active')}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{drivers.filter(d => d.driver_type === 'employee').length}</p>
              <p className="text-sm text-gray-500">{t('drivers.employees') || 'Employees'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{drivers.filter(d => d.driver_type === 'freelance').length}</p>
              <p className="text-sm text-gray-500">{t('drivers.freelance') || 'Freelance'}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('drivers.searchPlaceholder') || 'Search by name, email, or license...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('drivers.type') || 'Type'}</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="employee">{t('drivers.employee')}</option>
                  <option value="freelance">{t('drivers.freelance')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drivers List */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                    <th className="px-4 py-3 font-medium">{t('drivers.contact') || 'Contact'}</th>
                    <th className="px-4 py-3 font-medium">{t('drivers.license') || 'License'}</th>
                    <th className="px-4 py-3 font-medium">{t('drivers.type') || 'Type'}</th>
                    <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                    <th className="px-4 py-3 font-medium">{t('drivers.today') || 'Today'}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{driver.first_name} {driver.last_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-xs">{driver.email}</p>
                        {driver.phone && <p className="text-xs text-gray-500">{driver.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {driver.license_number ? (
                          <div>
                            <p className="text-xs font-mono">{driver.license_number}</p>
                            {driver.license_expiry && (
                              <p className={`text-xs ${
                                new Date(driver.license_expiry) < new Date(Date.now() + 30 * 86400000)
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}>
                                {t('drivers.expires') || 'Expires'}: {new Date(driver.license_expiry).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          driver.driver_type === 'employee'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t(`drivers.${driver.driver_type}`) || driver.driver_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          driver.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t(`common.${driver.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {driver.assigned_tours_count ? (
                          <span className="text-xs text-blue-600 font-medium">
                            🚌 {driver.assigned_tours_count} {t('drivers.tours') || 'tours'}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {t('drivers.available') || 'Available'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(driver)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => toggleDriverStatus(driver)}
                            className={`text-xs font-medium ${
                              driver.status === 'active'
                                ? 'text-red-600 hover:underline'
                                : 'text-green-600 hover:underline'
                            }`}
                          >
                            {driver.status === 'active' ? t('drivers.deactivate') : t('drivers.activate')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        {t('drivers.noDrivers') || 'No drivers found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingDriver) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingDriver ? t('drivers.editDriver') : t('drivers.addNewDriver')}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingDriver(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={editingDriver ? handleUpdateDriver : handleAddDriver}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.firstName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.lastName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('auth.email')} *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!!editingDriver}
                    />
                    {editingDriver && (
                      <p className="text-xs text-gray-500 mt-1">{t('drivers.emailNote') || 'Email cannot be changed'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('drivers.phone') || 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('drivers.licenseNumber') || 'License Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('drivers.licenseExpiry') || 'License Expiry'}
                    </label>
                    <input
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('drivers.driverType') || 'Driver Type'}
                    </label>
                    <select
                      value={formData.driver_type}
                      onChange={(e) => setFormData({ ...formData, driver_type: e.target.value as 'employee' | 'freelance' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="employee">{t('drivers.employee')}</option>
                      <option value="freelance">{t('drivers.freelance')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('drivers.hireDate') || 'Hire Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? t('common.saving')
                      : editingDriver
                        ? t('drivers.updateDriver')
                        : t('drivers.createDriver')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingDriver(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
