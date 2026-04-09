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
  const [vehicles, setVehicles] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour with guide and vehicle info
    const { data: tourData } = await supabase
      .from('tours')
      .select(`
        *,
        guide:profiles!guide_id(first_name, last_name, full_name),
        vehicle:vehicles!vehicle_id(plate_number, make, model)
      `)
      .eq('id', tourId)
      .single()

    if (tourData) {
      setTour({
        ...tourData,
        guide_name: tourData.guide?.first_name 
          ? `${tourData.guide.first_name} ${tourData.guide.last_name || ''}`.trim()
          : tourData.guide?.full_name || 'Unassigned',
        vehicle_display: tourData.vehicle 
          ? `${tourData.vehicle.plate_number} - ${tourData.vehicle.make} ${tourData.vehicle.model}`
          : 'Unassigned'
      })
    }

    // Load guides
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'guide')
      .eq('is_active', true)

    setGuides(guidesData || [])

    // Load vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .eq('status', 'available')

    setVehicles(vehiclesData || [])
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <Link href="/admin/tours" className="text-blue-600 hover:text-blue-800 text-sm">
                ← {t('tours.backToTours')}
              </Link>
              <h1 className="text-xl font-bold mt-2">{tour.name}</h1>
            </div>
            <button
              onClick={() => handleDelete()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Tour Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('tours.details')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.status')}</label>
                  <select
                    value={tour.status}
                    onChange={(e) => handleUpdate({ status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="scheduled">{t('tours.scheduled')}</option>
                    <option value="in_progress">{t('tours.inProgress')}</option>
                    <option value="completed">{t('tours.completed')}</option>
                    <option value="cancelled">{t('tours.cancelled')}</option>
                  </select>
                  {saving && <span className="text-xs text-gray-500 ml-2">{t('tours.saving')}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.guide')}</label>
                  <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {tour.guide_name || t('tours.unassigned')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.vehicle')}</label>
                  <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {tour.vehicle_display || t('tours.unassigned')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.startTime')}</label>
                    <input
                      type="time"
                      value={tour.start_time}
                      onChange={(e) => handleUpdate({ start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.endTime')}</label>
                    <input
                      type="time"
                      value={tour.end_time || ''}
                      onChange={(e) => handleUpdate({ end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.pickupLocation')}</label>
                  <input
                    type="text"
                    value={tour.pickup_location || ''}
                    onChange={(e) => handleUpdate({ pickup_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('tours.pickupPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.dropoffLocation')}</label>
                  <input
                    type="text"
                    value={tour.dropoff_location || ''}
                    onChange={(e) => handleUpdate({ dropoff_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('tours.dropoffPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('tours.description')}</h2>
              <textarea
                value={tour.description || ''}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('tours.descriptionPlaceholder')}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}