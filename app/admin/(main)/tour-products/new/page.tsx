'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { normalizeServiceCode, serviceCodeExists } from '@/lib/tour-products'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  duration_minutes: number
}

interface Checklist {
  id: string
  name: string
  stage: string
}

export default function NewTourProductPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [companyId, setCompanyId] = useState('')

  // Form state
  const [serviceCode, setServiceCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationHours, setDurationHours] = useState(8)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  // Checklist assignments by stage
  const [checklistAssignments, setChecklistAssignments] = useState({
    pre_departure: [] as string[],
    pre_pickup: {
      enabled: false,
      checklists: [] as string[]
    },
    activity: {} as Record<string, string[]>,
    dropoff: [] as string[],
    finish: [] as string[]
  })
  const [requiresGuide, setRequiresGuide] = useState(true)
  const [requiresDriver, setRequiresDriver] = useState(true)
  const [maxGuests, setMaxGuests] = useState(20)

  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

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

    setCompanyId(profile.company_id)

    // Load activities
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('id, name, duration_minutes')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name')

    setActivities(activitiesData || [])

    // Load checklists with stage
    const { data: checklistsData } = await supabase
      .from('checklists')
      .select('id, name, stage')
      .or(`company_id.eq.${profile.company_id},company_id.is.null`)
      .eq('is_active', true)
      .order('name')

    setChecklists(checklistsData || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!serviceCode.trim()) {
      setError(t('tourProducts.errorServiceCode') || 'Service code is required')
      return
    }

    if (!name.trim()) {
      setError(t('tourProducts.errorName') || 'Product name is required')
      return
    }

    if (selectedActivities.length === 0) {
      setError(t('tourProducts.errorActivities') || 'Select at least one activity')
      return
    }

    // Check for duplicate service code
    const normalizedCode = normalizeServiceCode(serviceCode)
    const exists = await serviceCodeExists(companyId, normalizedCode)
    if (exists) {
      setError(t('tourProducts.errorDuplicateCode') || `Service code "${normalizedCode}" already exists`)
      return
    }

    setSaving(true)

    const totalDurationMinutes = (durationHours * 60) + durationMinutes

    const { error: insertError } = await supabase
      .from('tour_products')
      .insert({
        company_id: companyId,
        service_code: normalizedCode,
        name: name.trim(),
        description: description.trim() || null,
        duration_minutes: totalDurationMinutes,
        activity_ids: selectedActivities,
        checklist_assignments: checklistAssignments,
        requires_guide: requiresGuide,
        requires_driver: requiresDriver,
        max_guests: maxGuests,
        is_active: true
      })

    setSaving(false)

    if (insertError) {
      console.error('Error creating product:', insertError)
      setError(insertError.message)
      return
    }

    router.push('/admin/tour-products')
  }



  function moveActivity(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      const newOrder = [...selectedActivities]
      ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
      setSelectedActivities(newOrder)
      // Also reorder activity checklists
      const newActivityAssignments: Record<string, string[]> = {}
      newOrder.forEach(id => {
        newActivityAssignments[id] = checklistAssignments.activity[id] || []
      })
      setChecklistAssignments(prev => ({...prev, activity: newActivityAssignments}))
    } else if (direction === 'down' && index < selectedActivities.length - 1) {
      const newOrder = [...selectedActivities]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      setSelectedActivities(newOrder)
      // Also reorder activity checklists
      const newActivityAssignments: Record<string, string[]> = {}
      newOrder.forEach(id => {
        newActivityAssignments[id] = checklistAssignments.activity[id] || []
      })
      setChecklistAssignments(prev => ({...prev, activity: newActivityAssignments}))
    }
  }

  function toggleActivity(activityId: string) {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
    // Initialize activity checklists when activity added
    if (!selectedActivities.includes(activityId)) {
      setChecklistAssignments(prev => ({
        ...prev,
        activity: {
          ...prev.activity,
          [activityId]: []
        }
      }))
    } else {
      // Remove activity checklists when activity removed
      setChecklistAssignments(prev => {
        const newActivity = {...prev.activity}
        delete newActivity[activityId]
        return {...prev, activity: newActivity}
      })
    }
  }

  // Helper to add/remove checklists from arrays
  function addChecklist(stage: keyof typeof checklistAssignments, checklistId: string, activityId?: string) {
    if (stage === 'pre_pickup') {
      setChecklistAssignments(prev => ({
        ...prev,
        pre_pickup: {
          ...prev.pre_pickup,
          checklists: [...prev.pre_pickup.checklists, checklistId]
        }
      }))
    } else if (stage === 'activity' && activityId) {
      setChecklistAssignments(prev => ({
        ...prev,
        activity: {
          ...prev.activity,
          [activityId]: [...(prev.activity[activityId] || []), checklistId]
        }
      }))
    } else if (stage === 'pre_departure' || stage === 'dropoff' || stage === 'finish') {
      setChecklistAssignments(prev => ({
        ...prev,
        [stage]: [...(prev[stage] as string[]), checklistId]
      }))
    }
  }

  function removeChecklist(stage: keyof typeof checklistAssignments, checklistId: string, activityId?: string) {
    if (stage === 'pre_pickup') {
      setChecklistAssignments(prev => ({
        ...prev,
        pre_pickup: {
          ...prev.pre_pickup,
          checklists: prev.pre_pickup.checklists.filter(id => id !== checklistId)
        }
      }))
    } else if (stage === 'activity' && activityId) {
      setChecklistAssignments(prev => ({
        ...prev,
        activity: {
          ...prev.activity,
          [activityId]: (prev.activity[activityId] || []).filter(id => id !== checklistId)
        }
      }))
    } else if (stage === 'pre_departure' || stage === 'dropoff' || stage === 'finish') {
      setChecklistAssignments(prev => ({
        ...prev,
        [stage]: (prev[stage] as string[]).filter(id => id !== checklistId)
      }))
    }
  }

  function togglePrePickup(enabled: boolean) {
    setChecklistAssignments(prev => ({
      ...prev,
      pre_pickup: {
        ...prev.pre_pickup,
        enabled
      }
    }))
  }

  const selectedActivitiesList = selectedActivities
    .map(id => activities.find(a => a.id === id))
    .filter(Boolean) as Activity[]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <Link href="/admin/tour-products" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← {t('common.back') || 'Back'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('tourProducts.newTitle') || 'Create Tour Product'}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">{t('tourProducts.basicInfo') || 'Basic Information'}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                {t('tourProducts.serviceCode') || 'Service Code'} *
              </label>
              <input
                type="text"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder="TCA, CHICHEN, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('tourProducts.serviceCodeHelp') || 'Will be normalized: TCA IN → TCA IN'}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                {t('tourProducts.productName') || 'Product Name'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tulum Cenote Akumal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                {t('tourProducts.description') || 'Description'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                {t('tourProducts.duration') || 'Duration'} *
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <p className="text-xs text-gray-400 text-center mt-1">{t('common.hours') || 'Hours'}</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    min={0}
                    max={59}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <p className="text-xs text-gray-400 text-center mt-1">{t('common.minutes') || 'Minutes'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t('tourProducts.activities') || 'Activities'} *
          </h2>

          {selectedActivitiesList.length > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">{t('tourProducts.selectedActivities') || 'Selected Activities (in order):'}</p>
              <div className="space-y-2">
                {selectedActivitiesList.map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-2 bg-white rounded p-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span className="flex-1">{activity.name}</span>
                    <span className="text-gray-500 text-sm">⏱️ {activity.duration_minutes}m</span>
                    <button
                      type="button"
                      onClick={() => moveActivity(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActivity(index, 'down')}
                      disabled={index === selectedActivitiesList.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-auto border border-gray-200 rounded-lg p-2">
            {activities.map((activity) => (
              <label
                key={activity.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                  selectedActivities.includes(activity.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(activity.id)}
                  onChange={() => toggleActivity(activity.id)}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-gray-500">⏱️ {activity.duration_minutes}m</p>
                </div>
              </label>
            ))}

            {activities.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                {t('tourProducts.noActivities') || 'No activities available. Create activities first.'}
              </p>
            )}
          </div>
        </div>

        {/* Checklist Sections by Stage */}
        
        {/* Pre-Departure */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">🚌 Pre-Departure Checklists</h2>
          <div className="space-y-2">
            {checklistAssignments.pre_departure.map((checklistId, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={checklistId}
                  onChange={(e) => {
                    const newChecklists = [...checklistAssignments.pre_departure]
                    newChecklists[idx] = e.target.value
                    setChecklistAssignments(prev => ({...prev, pre_departure: newChecklists}))
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Select checklist...</option>
                  {checklists.filter(c => c.stage === 'pre_departure').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeChecklist('pre_departure', checklistId)}
                  className="text-red-400 hover:text-red-600 px-2"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addChecklist('pre_departure', '')}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >+ Add Pre-Departure Checklist</button>
          </div>
        </div>

        {/* Pre-Pickup (Optional) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">📍 Pre-Pickup Checklists</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checklistAssignments.pre_pickup.enabled}
                onChange={(e) => togglePrePickup(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm text-gray-700">Enable pre-pickup step (private tours)</span>
            </label>
          </div>
          {checklistAssignments.pre_pickup.enabled && (
            <div className="space-y-2">
              {checklistAssignments.pre_pickup.checklists.map((checklistId, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={checklistId}
                    onChange={(e) => {
                      const newChecklists = [...checklistAssignments.pre_pickup.checklists]
                      newChecklists[idx] = e.target.value
                      setChecklistAssignments(prev => ({
                        ...prev,
                        pre_pickup: {...prev.pre_pickup, checklists: newChecklists}
                      }))
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Select checklist...</option>
                    {checklists.filter(c => c.stage === 'pre_pickup').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeChecklist('pre_pickup', checklistId)}
                    className="text-red-400 hover:text-red-600 px-2"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChecklist('pre_pickup', '')}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >+ Add Pre-Pickup Checklist</button>
            </div>
          )}
        </div>

        {/* Activity Checklists */}
        {selectedActivitiesList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">🏃 Activity Checklists</h2>
            <div className="space-y-4">
              {selectedActivitiesList.map((activity) => (
                <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900 mb-2">{activity.name}</p>
                  <div className="space-y-2">
                    {(checklistAssignments.activity[activity.id] || []).map((checklistId, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={checklistId}
                          onChange={(e) => {
                            const newChecklists = [...(checklistAssignments.activity[activity.id] || [])]
                            newChecklists[idx] = e.target.value
                            setChecklistAssignments(prev => ({
                              ...prev,
                              activity: {...prev.activity, [activity.id]: newChecklists}
                            }))
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="">Select checklist...</option>
                          {checklists.filter(c => c.stage === 'activity').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeChecklist('activity', checklistId, activity.id)}
                          className="text-red-400 hover:text-red-600 px-2"
                        >×</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChecklist('activity', '', activity.id)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
                    >+ Add Checklist for {activity.name}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropoff */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">🏨 Dropoff Checklists</h2>
          <div className="space-y-2">
            {checklistAssignments.dropoff.map((checklistId, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={checklistId}
                  onChange={(e) => {
                    const newChecklists = [...checklistAssignments.dropoff]
                    newChecklists[idx] = e.target.value
                    setChecklistAssignments(prev => ({...prev, dropoff: newChecklists}))
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Select checklist...</option>
                  {checklists.filter(c => c.stage === 'dropoff').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeChecklist('dropoff', checklistId)}
                  className="text-red-400 hover:text-red-600 px-2"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addChecklist('dropoff', '')}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >+ Add Dropoff Checklist</button>
          </div>
        </div>

        {/* Finish */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">✅ Finish Checklists</h2>
          <div className="space-y-2">
            {checklistAssignments.finish.map((checklistId, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={checklistId}
                  onChange={(e) => {
                    const newChecklists = [...checklistAssignments.finish]
                    newChecklists[idx] = e.target.value
                    setChecklistAssignments(prev => ({...prev, finish: newChecklists}))
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Select checklist...</option>
                  {checklists.filter(c => c.stage === 'finish').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeChecklist('finish', checklistId)}
                  className="text-red-400 hover:text-red-600 px-2"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addChecklist('finish', '')}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >+ Add Finish Checklist</button>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t('tourProducts.requirements') || 'Requirements'}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('tourProducts.requiresGuide') || 'Requires Guide'}</p>
              </div>
              <button
                type="button"
                onClick={() => setRequiresGuide(!requiresGuide)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  requiresGuide ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    requiresGuide ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('tourProducts.requiresDriver') || 'Requires Driver'}</p>
              </div>
              <button
                type="button"
                onClick={() => setRequiresDriver(!requiresDriver)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  requiresDriver ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    requiresDriver ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                {t('tourProducts.maxGuests') || 'Maximum Guests'}
              </label>
              <input
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/admin/tour-products"
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-200"
          >
            {t('common.cancel') || 'Cancel'}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (t('common.saving') || 'Saving...') : (t('common.create') || 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  )
}
