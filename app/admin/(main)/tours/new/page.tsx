'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { notifyTourAssignment } from '@/lib/push-notifications'

export default function CreateTourPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brands, setBrands] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [tourTypes, setTourTypes] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    tourDate: '',
    startTime: '',
    capacity: 15,
    guestCount: 0,
    pickupLocation: '',
    description: '',
    brandId: '',
    tourTypeId: '',
    guideId: '',
    driverId: '',
    vehicleId: '',
    hasPrePickup: false,
  })

  useEffect(() => {
    loadDropdownData()
  }, [])

  async function loadDropdownData() {
    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    // Load data filtered by company
    const { data: brandsData } = await supabase
      .from('brands')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name')
    
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'guide')
      .eq('company_id', profile.company_id)
      .order('full_name')
    
    const { data: driversData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'driver')
      .eq('company_id', profile.company_id)
      .order('full_name')
    
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, name, plate_number, model')
      .eq('company_id', profile.company_id)
      .eq('status', 'available')
      .order('plate_number')
    
    const { data: tourTypesData } = await supabase
      .from('tour_types')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    setBrands(brandsData || [])
    setGuides(guidesData || [])
    setDrivers(driversData || [])
    setVehicles(vehiclesData || [])
    setTourTypes(tourTypesData || [])
    
    if (brandsData?.length) {
      setFormData(prev => ({ ...prev, brandId: brandsData[0].id }))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'capacity' || name === 'guestCount' ? parseInt(value) || 0 : value 
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create tour
      const { data: tour, error: tourError } = await supabase
        .from('tours')
        .insert({
          company_id: companyId,
          brand_id: formData.brandId,
          tour_type_id: formData.tourTypeId || null,
          name: formData.name,
          tour_date: formData.tourDate,
          start_time: formData.startTime,
          capacity: formData.capacity,
          guest_count: formData.guestCount,
          pickup_location: formData.pickupLocation,
          description: formData.description,
          guide_id: formData.guideId || null,
          driver_id: formData.driverId || null,
          vehicle_id: formData.vehicleId || null,
          status: 'scheduled',
          has_pre_pickup: formData.hasPrePickup,
        })
        .select('id')
        .single()

      if (tourError) throw tourError

      // Seed activities from tour_type
      if (tour && formData.tourTypeId) {
        const { data: tourType } = await supabase
          .from('tour_types')
          .select('activities')
          .eq('id', formData.tourTypeId)
          .single()

        if (tourType?.activities && Array.isArray(tourType.activities)) {
          const activities = tourType.activities as Array<{name: string; duration_minutes: number; sort_order: number}>
          const [hours, minutes] = formData.startTime.split(':').map(Number)
          
          for (const activity of activities) {
            // Calculate time for each activity (cumulative)
            const activityMinutes = (hours * 60 + minutes) + (activity.sort_order - 1) * (activity.duration_minutes || 60)
            const activityTime = `${String(Math.floor(activityMinutes / 60)).padStart(2, '0')}:${String(activityMinutes % 60).padStart(2, '0')}:00`

            await supabase
              .from('pickup_stops')
              .insert({
                tour_id: tour.id,
                brand_id: formData.brandId,
                sort_order: activity.sort_order + 100, // Activities after pickups (pickups are 1-99)
                location_name: activity.name,
                scheduled_time: activityTime,
                stop_type: 'activity'
              })
          }
        }
      }

      // Send push notification to assigned guide
      if (formData.guideId && tour) {
        await notifyTourAssignment({
          guideId: formData.guideId,
          tourId: tour.id,
          tourName: formData.name,
          tourDate: formData.tourDate,
        })
      }

      router.push('/admin/tours')
    } catch (err: any) {
      setError(err.message || 'Failed to create tour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <Link href="/admin/tours" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('tours.backToTours')}
            </Link>
            <h1 className="text-xl font-bold">{t('tours.createNew')}</h1>
            <p className="text-gray-500 text-sm">{t('tours.scheduleNew')}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-md mx-auto space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.tourName')} *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('tours.tourNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.brand')} *</label>
              <select
                name="brandId"
                required
                value={formData.brandId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tour Type</label>
              <select
                name="tourTypeId"
                value={formData.tourTypeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tour type (optional)</option>
                {tourTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Activities will be auto-created from tour type</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.date')} *</label>
                <input
                  type="date"
                  name="tourDate"
                  required
                  value={formData.tourDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.startTime')} *</label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.capacity')} *</label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.guestCount')}</label>
                <input
                  type="number"
                  name="guestCount"
                  min={0}
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.pickupLocation')}</label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('tours.pickupPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.assignedGuide')}</label>
                <select
                  name="guideId"
                  value={formData.guideId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('tours.selectGuide')}</option>
                  {guides.map((guide) => (
                    <option key={guide.id} value={guide.id}>{guide.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Driver</label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select driver...</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.assignedVehicle')}</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('tours.selectVehicle')}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tours.description')}</label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('tours.descriptionPlaceholder')}
              />
            </div>

            {/* Pre-Pickup Toggle */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasPrePickup"
                  checked={formData.hasPrePickup}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasPrePickup: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Require Pre-Pickup</span>
                  <p className="text-sm text-gray-600">Guide must check in 20 min before pickup time (for private tours)</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? t('tours.creating') : t('tours.createTour')}
              </button>
              <Link
                href="/admin/tours"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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