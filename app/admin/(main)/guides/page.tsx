'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  status: 'active' | 'inactive'
  assigned_tours_count?: number
  is_available?: boolean // For today's availability
}

export default function GuidesManagement() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guides, setGuides] = useState<Guide[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
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
        .from('profiles')
        .select('id, first_name, last_name, email, phone, status')
        .eq('company_id', companyId)
        .eq('role', 'guide')
        .order('created_at', { ascending: false })

      const today = getLocalDate()

      const { data: tours } = await supabase
        .from('tours')
        .select('guide_id')
        .eq('tour_date', today)
        .neq('status', 'cancelled')

      const assignmentCount: Record<string, number> = {}
      tours?.forEach((t: any) => {
        if (t.guide_id) {
          assignmentCount[t.guide_id] = (assignmentCount[t.guide_id] || 0) + 1
        }
      })

      // Load availability for today
      const guideIds = (data || []).map((g: any) => g.id)
      const { data: availabilityData } = await supabase
        .from('guide_schedules')
        .select('guide_id, is_available')
        .in('guide_id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('schedule_date', today)

      const availabilityMap: Record<string, boolean> = {}
      availabilityData?.forEach((a: any) => {
        availabilityMap[a.guide_id] = a.is_available
      })

      const formatted: Guide[] = (data || []).map((g: any) => ({
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email,
        phone: g.phone,
        status: g.status,
        assigned_tours_count: assignmentCount[g.id] || 0,
        // Available if: no schedule entry (implicitly available) OR is_available=true
        is_available: availabilityMap[g.id] !== false
      }))

      setGuides(formatted)
    } catch (error) {
      console.error('Error loading guides:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddGuide(e: React.FormEvent) {
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

      const { error } = await supabase
        .from('profiles')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'guide',
          status: 'active',
          company_id: profile?.company_id
        })

      if (error) throw error

      setShowAddModal(false)
      resetForm()
      loadGuides()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateGuide(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGuide) return
   
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('id', editingGuide.id)

      if (error) throw error

      setEditingGuide(null)
      resetForm()
      loadGuides()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleGuideStatus(guide: Guide) {
    try {
      const newStatus = guide.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', guide.id)

      if (error) throw error
      loadGuides()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    })
  }

  const filteredGuides = guides.filter(g => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        g.first_name.toLowerCase().includes(q) ||
        g.last_name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function toggleGuideAvailability(guide: Guide) {
    try {
      const today = getLocalDate()
      const newAvailability = !guide.is_available
      
      // Use upsert to create or update availability
      const { error } = await supabase
        .from('guide_schedules')
        .upsert({
          guide_id: guide.id,
          schedule_date: today,
          is_available: newAvailability
        }, {
          onConflict: 'guide_id,schedule_date'
        })

      if (error) throw error
      loadGuides()
    } catch (error: any) {
      alert('Error updating availability: ' + error.message)
    }
  }

  function openEditModal(guide: Guide) {
    setEditingGuide(guide)
    setFormData({
      first_name: guide.first_name,
      last_name: guide.last_name,
      email: guide.email,
      phone: guide.phone || ''
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
              <h1 className="text-2xl font-bold text-gray-900">{t('guides.title') || 'Guides'}</h1>
              <p className="text-sm text-gray-500">{t('guides.subtitle') || 'Manage guides and assignments'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/guides/availability"
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                📅 {t('guides.manageAvailability') || 'Manage Availability'}
              </Link>
              <button
                onClick={() => {
                  resetForm()
                  setShowAddModal(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                + {t('guides.addGuide') || 'Add Guide'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold">{guides.length}</p>
              <p className="text-sm text-gray-500">{t('guides.totalGuides') || 'Total Guides'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{guides.filter(g => g.status === 'active').length}</p>
              <p className="text-sm text-gray-500">{t('common.active')}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {guides.reduce((sum, g) => sum + (g.assigned_tours_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">{t('guides.toursToday') || 'Tours Today'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {guides.filter(g => g.status === 'active' && g.is_available).length}
              </p>
              <p className="text-sm text-gray-500">{t('guides.availableToday') || 'Available Today'}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('guides.searchPlaceholder') || 'Search by name or email...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
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

          {/* Guides List */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                    <th className="px-4 py-3 font-medium">{t('guides.contact') || 'Contact'}</th>
                    <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                    <th className="px-4 py-3 font-medium">{t('guides.availability') || 'Availability'}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGuides.map((guide) => (
                    <tr key={guide.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{guide.first_name} {guide.last_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-xs">{guide.email}</p>
                        {guide.phone && <p className="text-xs text-gray-500">{guide.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guide.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t(`common.${guide.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGuideAvailability(guide)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            guide.is_available
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {guide.is_available
                            ? (t('guides.available') || 'Available')
                            : (t('guides.unavailable') || 'Unavailable')
                          }
                        </button>
                        {(guide.assigned_tours_count || 0) > 0 && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            🚌 {guide.assigned_tours_count} {t('guides.toursAssigned') || 'assigned'}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(guide)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => toggleGuideStatus(guide)}
                            className={`text-xs font-medium ${
                              guide.status === 'active'
                                ? 'text-red-600 hover:underline'
                                : 'text-green-600 hover:underline'
                            }`}
                          >
                            {guide.status === 'active' ? t('guides.deactivate') : t('guides.activate')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGuides.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {t('guides.noGuides') || 'No guides found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingGuide) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingGuide ? t('guides.editGuide') : t('guides.addNewGuide')}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingGuide(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={editingGuide ? handleUpdateGuide : handleAddGuide}
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
                    disabled={!!editingGuide}
                  />
                  {editingGuide && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('guides.phone') || 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? t('common.saving')
                      : editingGuide
                        ? t('guides.updateGuide')
                        : t('guides.createGuide')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingGuide(null)
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
