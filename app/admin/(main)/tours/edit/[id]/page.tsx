'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function EditTourPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const tourId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tour_date: '',
    start_time: '',
    end_time: '',
    pickup_location: '',
    dropoff_location: '',
    guide_id: '',
    vehicle_id: '',
    status: 'scheduled',
    has_pre_pickup: false,
  })

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    // Load tour
    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tour) {
      setFormData({
        name: tour.name || '',
        description: tour.description || '',
        tour_date: tour.tour_date || '',
        start_time: tour.start_time || '',
        end_time: tour.end_time || '',
        pickup_location: tour.pickup_location || '',
        dropoff_location: tour.dropoff_location || '',
        guide_id: tour.guide_id || '',
        vehicle_id: tour.vehicle_id || '',
        status: tour.status || 'scheduled',
        has_pre_pickup: tour.has_pre_pickup || false,
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

    setVehicles(vehiclesData || [])
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('tours')
      .update({
        name: formData.name,
        description: formData.description || null,
        tour_date: formData.tour_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        guide_id: formData.guide_id || null,
        vehicle_id: formData.vehicle_id || null,
        status: formData.status,
        has_pre_pickup: formData.has_pre_pickup,
      })
      .eq('id', tourId)

    setSaving(false)
    
    if (!error) {
      router.push('/admin/tours')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <Link href="/admin/tours" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('templates.backToTours')}
            </Link>
            <h1 className="text-xl font-bold">{t('templates.editTour')}</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.tourName')} *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.description')}</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.date')} *</label>
                <input
                  type="date"
                  name="tour_date"
                  required
                  value={formData.tour_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.startTime')} *</label>
                <input
                  type="time"
                  name="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.endTime')}</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.pickupLocation')}</label>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.dropoffLocation')}</label>
                <input
                  type="text"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.guide')}</label>
                <select
                  name="guide_id"
                  value={formData.guide_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{t('templates.unassigned')}</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.vehicle')}</label>
                <select
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{t('templates.unassigned')}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.status')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="scheduled">{t('templates.scheduled')}</option>
                <option value="in_progress">{t('templates.inProgress')}</option>
                <option value="completed">{t('templates.completed')}</option>
                <option value="cancelled">{t('templates.cancelled')}</option>
              </select>
            </div>

            {/* Pre-Pickup Toggle */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_pre_pickup"
                  checked={formData.has_pre_pickup}
                  onChange={(e) => setFormData({ ...formData, has_pre_pickup: e.target.checked })}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Require Pre-Pickup</span>
                  <p className="text-sm text-gray-600">Guide must check in 20 min before pickup time (for private tours)</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t('templates.saving') : t('templates.saveChanges')}
              </button>

              <Link
                href="/admin/tours"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}