'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function NewTemplatePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [guides, setGuides] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 120,
    capacity: 20,
    pickup_location: '',
    dropoff_location: '',
    default_guide_id: '',
    default_vehicle_id: '',
    checklist_template_id: '',
    brand_id: '',
    price: '',
  })

  useEffect(() => {
    loadOptions()
  }, [])

  async function loadOptions() {
    const [{ data: g }, { data: v }, { data: c }, { data: b }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'guide'),
      supabase.from('vehicles').select('id, plate_number, make, model').eq('status', 'available'),
      supabase.from('checklists').select('id, name'),
      supabase.from('brands').select('id, name'),
    ])

    setGuides(g || [])
    setVehicles(v || [])
    setChecklists(c || [])
    setBrands(b || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session?.user?.id || '')
      .single()

    if (!profile?.company_id) {
      alert('Company not found')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('tour_templates')
      .insert({
        company_id: profile.company_id,
        name: formData.name,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        capacity: formData.capacity,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        default_guide_id: formData.default_guide_id || null,
        default_vehicle_id: formData.default_vehicle_id || null,
        checklist_template_id: formData.checklist_template_id || null,
        brand_id: formData.brand_id || null,
        price: formData.price ? parseFloat(formData.price) : null,
        created_by: session?.user?.id,
      })

    setSaving(false)

    if (!error) {
      router.push('/admin/templates')
    } else {
      alert('Failed to create template: ' + error.message)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="text-gray-500">{t('common.loading')}</div></div>

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <Link href="/admin/templates" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('templates.backToTemplates')}
            </Link>
            <h1 className="text-xl font-bold">{t('templates.newTemplate')}</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.templateName')} *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={t('templates.templateNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.duration')} *</label>
                <input
                  type="number"
                  name="duration_minutes"
                  required
                  min="30"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.capacity')} *</label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.price')}</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.pickupLocation')}</label>
              <input
                type="text"
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.dropoffLocation')}</label>
              <input
                type="text"
                name="dropoff_location"
                value={formData.dropoff_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.defaultGuide')}</label>
              <select
                name="default_guide_id"
                value={formData.default_guide_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t('templates.assignLater')}</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.first_name} {g.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.defaultVehicle')}</label>
              <select
                name="default_vehicle_id"
                value={formData.default_vehicle_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t('templates.assignLater')}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.checklistTemplate')}</label>
              <select
                name="checklist_template_id"
                value={formData.checklist_template_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t('templates.none')}</option>
                {checklists.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.brand')}</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t('templates.none')}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? t('templates.creating') : t('templates.createTemplate')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}