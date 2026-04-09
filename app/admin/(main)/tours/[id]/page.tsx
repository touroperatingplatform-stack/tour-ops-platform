'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function TourDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const tourId = params.id as string
  
  const [tour, setTour] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guides, setGuides] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [pickupCount, setPickupCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour with guide, driver and vehicle info
    const { data: tourData } = await supabase
      .from('tours')
      .select(`
        *,
        guide:profiles!guide_id(first_name, last_name, full_name),
        driver:profiles!driver_id(first_name, last_name, full_name),
        vehicle:vehicles!vehicle_id(id, name, plate_number, make, model)
      `)
      .eq('id', tourId)
      .single()

    if (tourData) {
      setTour({
        ...tourData,
        guide_id: tourData.guide_id,
        driver_id: tourData.driver_id,
        vehicle_id: tourData.vehicle_id,
        guide_name: tourData.guide?.first_name 
          ? `${tourData.guide.first_name} ${tourData.guide.last_name || ''}`.trim()
          : tourData.guide?.full_name || 'Unassigned',
        driver_name: tourData.driver?.first_name
          ? `${tourData.driver.first_name} ${tourData.driver.last_name || ''}`.trim()
          : tourData.driver?.full_name || 'Unassigned',
        vehicle_display: tourData.vehicle?.name || 'Unassigned'
      })
    }

    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    let companyId = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      companyId = profile?.company_id
    }

    // Load guides for this company
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .eq('role', 'guide')
      .eq('company_id', companyId)

    setGuides(guidesData || [])

    // Load drivers for this company
    const { data: driversData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .eq('role', 'driver')
      .eq('company_id', companyId)

    setDrivers(driversData || [])

    // Load vehicles for this company
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, name, plate_number, make, model')
      .eq('company_id', companyId)

    setVehicles(vehiclesData || [])

    // Load checklists for this company + system defaults
    const { data: checklistsData } = await supabase
      .from('checklists')
      .select('id, name, company_id')
      .or(`company_id.eq.${companyId},company_id.is.null`)
      .eq('is_active', true)

    setChecklists(checklistsData || [])

    // Load guest count
    const { data: manifestData } = await supabase
      .from('reservation_manifest')
      .select('total_pax')
      .eq('tour_id', tourId)
    setGuestCount(manifestData?.reduce((sum, r) => sum + (r.total_pax || 0), 0) || 0)

    // Load pickup stops count
    const { data: stopsData } = await supabase
      .from('pickup_stops')
      .select('id')
      .eq('tour_id', tourId)
      .eq('stop_type', 'pickup')
    setPickupCount(stopsData?.length || 0)

    setLoading(false)
  }

  async function handleUpdate(updates: any) {
    setSaving(true)
    await supabase
      .from('tours')
      .update(updates)
      .eq('id', tourId)
    
    setTour({ ...tour, ...updates })
    setSaving(false)
    // Reload to get updated names
    loadData()
  }

  async function handleDelete() {
    if (!confirm(t('tours.confirmDelete'))) return
    
    await supabase
      .from('tours')
      .delete()
      .eq('id', tourId)
    
    router.push('/admin/tours')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (!tour) {
    return <div className="p-4">{t('tours.notFound')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <Link href="/admin/tours" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← {t('tours.backToTours')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-gray-600">
            <span>📅 {tour.tour_date}</span>
            <span>•</span>
            <span>⏰ {tour.start_time?.slice(0, 5)}</span>
            <span>•</span>
            <span>👥 {guestCount} guests</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Staff Assignments */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Staff Assignments {saving && <span className="text-blue-500 text-sm">• Saving...</span>}</h2>
          
          <div className="space-y-4">
            {/* Guide */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">👤 Guide</label>
              <select
                value={tour.guide_id || ''}
                onChange={(e) => handleUpdate({ guide_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.first_name && g.last_name ? `${g.first_name} ${g.last_name}` : g.full_name || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">🚐 Driver</label>
              <select
                value={tour.driver_id || ''}
                onChange={(e) => handleUpdate({ driver_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : d.full_name || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">🚌 Vehicle</label>
              <select
                value={tour.vehicle_id || ''}
                onChange={(e) => handleUpdate({ vehicle_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">📋 Checklist</label>
              <select
                value={tour.checklist_id || ''}
                onChange={(e) => handleUpdate({ checklist_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">No checklist assigned</option>
                {checklists.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {!c.company_id ? '(System)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Guest Manifest */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Guest Manifest ({guestCount})</h2>
            <Link href={`/admin/tours/${tourId}/guests`} className="text-blue-600 text-sm font-medium">
              View full list →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{pickupCount}</p>
              <p className="text-sm text-gray-600">Pickup stops</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{guestCount}</p>
              <p className="text-sm text-gray-600">Guests</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link 
            href={`/admin/tours/edit/${tourId}`}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200"
          >
            ✏️ Edit Tour
          </Link>
          <div className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium text-center">
            📋 {tour.checklist_id && checklists.find(c => c.id === tour.checklist_id)?.name || 'No Checklist'}
          </div>
        </div>
      </div>
    </div>
  )
}
