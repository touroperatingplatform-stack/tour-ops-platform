'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import Link from 'next/link'

// Types
interface Activity {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  requires_checklist: boolean
  is_active: boolean
  company_id: string | null
  is_system: boolean
  checklist_ids: string[]
  linked_checklists?: Checklist[]
}

interface Checklist {
  id: string
  name: string
  description: string | null
  items: ChecklistItem[]
  stage: string
  is_active: boolean
  company_id: string | null
  is_system: boolean
  activity_count?: number
}

interface ChecklistItem {
  id: string
  text: string
  required: boolean
  photo_required: boolean
}

interface ActivityChecklistLink {
  activity_id: string
  checklist_id: string
}

interface TourProduct {
  id: string
  name: string
  service_code: string
  activity_ids: string[]
  checklist_assignments?: any
}

const STAGES = [
  { id: 'acknowledgement', label: 'Acknowledgement', icon: '👋', desc: 'Pre-tour guide confirmation' },
  { id: 'pre_departure', label: 'Pre-Departure', icon: '🚐', desc: 'Before leaving office' },
  { id: 'pre_pickup', label: 'Pre-Pickup', icon: '📍', desc: 'Before picking up guests' },
  { id: 'activity', label: 'Activity', icon: '🎯', desc: 'During tour activities' },
  { id: 'dropoff', label: 'Dropoff', icon: '🏁', desc: 'Guest dropoff phase' },
  { id: 'finish', label: 'Finish', icon: '✅', desc: 'Tour completion' }
]

export default function CompanyTourConfigurationPage() {
  const { t } = useTranslation()
  
  // Auth state
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  // Data states
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [links, setLinks] = useState<ActivityChecklistLink[]>([])
  const [tourProducts, setTourProducts] = useState<TourProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // UI states
  const [activeTab, setActiveTab] = useState<'activities' | 'checklists' | 'products'>('activities')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activeStage, setActiveStage] = useState('pre_departure')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)
  
  // Form states
  const [activityForm, setActivityForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    requires_checklist: true
  })
  
  const [checklistForm, setChecklistForm] = useState({
    name: '',
    description: '',
    stage: 'pre_departure',
    items: [] as ChecklistItem[]
  })

  // Load company and data
  useEffect(() => {
    loadCompanyAndData()
  }, [])

  async function loadCompanyAndData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profile?.company_id) {
      setCompanyId(profile.company_id)
      await loadData(profile.company_id)
    }
  }

  async function loadData(cId: string) {
    setLoading(true)
    
    // Load system + company activities
    const [{ data: systemActivities }, { data: companyActivities }] = await Promise.all([
      supabase.from('activities').select('*').is('company_id', null).eq('is_active', true),
      supabase.from('activities').select('*').eq('company_id', cId).eq('is_active', true)
    ])
    
    // Load system + company checklists
    const [{ data: systemChecklists }, { data: companyChecklists }] = await Promise.all([
      supabase.from('checklists').select('*').is('company_id', null).eq('is_active', true),
      supabase.from('checklists').select('*').eq('company_id', cId).eq('is_active', true)
    ])
    
    // Load links for system + company
    const { data: linksData } = await supabase
      .from('activity_checklist_links')
      .select('activity_id, checklist_id')
      .or(`is_system.eq.true,and(is_system.eq.false,company_id.eq.${cId})`)
    
    // Load tour products
    const { data: productsData } = await supabase
      .from('tour_products')
      .select('id, name, service_code, activity_ids, checklist_assignments')
      .eq('company_id', cId)
      .eq('is_active', true)
    
    // Combine and mark system vs custom
    const allActivities = [
      ...(systemActivities || []).map(a => ({ ...a, is_system: true })),
      ...(companyActivities || []).map(a => ({ ...a, is_system: false }))
    ].sort((a, b) => a.name.localeCompare(b.name))
    
    const allChecklists = [
      ...(systemChecklists || []).map(c => ({ ...c, is_system: true })),
      ...(companyChecklists || []).map(c => ({ ...c, is_system: false }))
    ]
    
    // Calculate activity counts
    const checklistsWithCounts = allChecklists.map(checklist => ({
      ...checklist,
      activity_count: linksData?.filter(l => l.checklist_id === checklist.id).length || 0
    }))
    
    // Merge links into activities
    const activitiesWithLinks = allActivities.map(activity => ({
      ...activity,
      checklist_ids: linksData?.filter(l => l.activity_id === activity.id).map(l => l.checklist_id) || [],
      linked_checklists: checklistsWithCounts.filter(c => 
        linksData?.some(l => l.activity_id === activity.id && l.checklist_id === c.id)
      ) || []
    }))
    
    setActivities(activitiesWithLinks)
    setChecklists(checklistsWithCounts)
    setLinks(linksData || [])
    setTourProducts(productsData || [])
    setLoading(false)
  }

  // Filter activities
  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (filterType === 'system') return matchesSearch && a.is_system
    if (filterType === 'custom') return matchesSearch && !a.is_system
    return matchesSearch
  })

  // Filter checklists by stage
  const filteredChecklists = checklists.filter(c => c.stage === activeStage)

  // Check if activity is editable (custom only)
  function isEditable(activity: Activity) {
    return !activity.is_system
  }

  // Toggle link (only for custom activities)
  async function toggleLink(activityId: string, checklistId: string) {
    const activity = activities.find(a => a.id === activityId)
    if (!activity || !companyId) return
    
    // Can't modify links for system activities
    if (activity.is_system) {
      alert('System activities cannot be modified. Create a custom activity to customize checklist links.')
      return
    }
    
    setSaving(true)
    
    const isLinked = links.some(l => l.activity_id === activityId && l.checklist_id === checklistId)
    
    if (isLinked) {
      await supabase
        .from('activity_checklist_links')
        .delete()
        .eq('activity_id', activityId)
        .eq('checklist_id', checklistId)
    } else {
      await supabase
        .from('activity_checklist_links')
        .insert({
          activity_id: activityId,
          checklist_id: checklistId,
          is_system: false,
          company_id: companyId
        })
    }
    
    await loadData(companyId)
    setSaving(false)
  }

  // Create custom activity
  async function createActivity() {
    if (!activityForm.name.trim() || !companyId) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('activities')
      .insert({
        name: activityForm.name,
        description: activityForm.description || null,
        duration_minutes: activityForm.duration_minutes,
        requires_checklist: activityForm.requires_checklist,
        is_active: true,
        company_id: companyId
      })
    
    if (!error) {
      setShowActivityModal(false)
      setActivityForm({ name: '', description: '', duration_minutes: 60, requires_checklist: true })
      await loadData(companyId)
    }
    
    setSaving(false)
  }

  // Update custom activity
  async function updateActivity() {
    if (!editingActivity || !activityForm.name.trim() || !companyId) return
    
    if (editingActivity.is_system) {
      alert('System activities cannot be edited.')
      return
    }
    
    setSaving(true)
    
    const { error } = await supabase
      .from('activities')
      .update({
        name: activityForm.name,
        description: activityForm.description || null,
        duration_minutes: activityForm.duration_minutes,
        requires_checklist: activityForm.requires_checklist
      })
      .eq('id', editingActivity.id)
    
    if (!error) {
      setEditingActivity(null)
      setActivityForm({ name: '', description: '', duration_minutes: 60, requires_checklist: true })
      await loadData(companyId)
    }
    
    setSaving(false)
  }

  // Delete custom activity
  async function deleteActivity(activityId: string) {
    const activity = activities.find(a => a.id === activityId)
    if (!activity || activity.is_system) {
      alert('System activities cannot be deleted.')
      return
    }
    
    if (!confirm('Delete this custom activity?')) return
    
    setSaving(true)
    await supabase.from('activities').update({ is_active: false }).eq('id', activityId)
    
    if (selectedActivity?.id === activityId) setSelectedActivity(null)
    await loadData(companyId!)
    setSaving(false)
  }

  // Create custom checklist
  async function createChecklist() {
    if (!checklistForm.name.trim() || checklistForm.items.length === 0 || !companyId) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('checklists')
      .insert({
        name: checklistForm.name,
        description: checklistForm.description || null,
        stage: checklistForm.stage,
        items: checklistForm.items.filter(i => i.text.trim()),
        is_active: true,
        company_id: companyId
      })
    
    if (!error) {
      setShowChecklistForm(false)
      setChecklistForm({ name: '', description: '', stage: 'pre_departure', items: [] })
      await loadData(companyId)
    }
    
    setSaving(false)
  }

  // Update custom checklist
  async function updateChecklist() {
    if (!editingChecklist || !checklistForm.name.trim() || !companyId) return
    
    if (editingChecklist.is_system) {
      alert('System checklists cannot be edited. Create a custom copy instead.')
      return
    }
    
    setSaving(true)
    
    const { error } = await supabase
      .from('checklists')
      .update({
        name: checklistForm.name,
        description: checklistForm.description || null,
        stage: checklistForm.stage,
        items: checklistForm.items.filter(i => i.text.trim())
      })
      .eq('id', editingChecklist.id)
    
    if (!error) {
      setEditingChecklist(null)
      setChecklistForm({ name: '', description: '', stage: 'pre_departure', items: [] })
      await loadData(companyId)
    }
    
    setSaving(false)
  }

  // Delete custom checklist
  async function deleteChecklist(checklistId: string) {
    const checklist = checklists.find(c => c.id === checklistId)
    if (!checklist || checklist.is_system) {
      alert('System checklists cannot be deleted.')
      return
    }
    
    if (!confirm('Delete this custom checklist?')) return
    
    setSaving(true)
    await supabase.from('checklists').update({ is_active: false }).eq('id', checklistId)
    await loadData(companyId!)
    setSaving(false)
  }

  // Duplicate checklist (system or custom)
  async function duplicateChecklist(checklist: Checklist) {
    if (!companyId) return
    
    setSaving(true)
    await supabase.from('checklists').insert({
      name: `${checklist.name} (Copy)`,
      description: checklist.description,
      stage: checklist.stage,
      items: checklist.items,
      is_active: true,
      company_id: companyId
    })
    
    await loadData(companyId)
    setSaving(false)
  }

  // Helper functions
  function addChecklistItem() {
    setChecklistForm(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), text: '', required: true, photo_required: false }]
    }))
  }

  function updateChecklistItem(index: number, field: keyof ChecklistItem, value: any) {
    setChecklistForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeChecklistItem(index: number) {
    setChecklistForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  function openEditActivity(activity: Activity) {
    if (activity.is_system) {
      alert('System activities cannot be edited. Create a custom activity instead.')
      return
    }
    setEditingActivity(activity)
    setActivityForm({
      name: activity.name,
      description: activity.description || '',
      duration_minutes: activity.duration_minutes,
      requires_checklist: activity.requires_checklist
    })
  }

  function openEditChecklist(checklist: Checklist) {
    if (checklist.is_system) {
      // For system checklists, duplicate instead of edit
      duplicateChecklist(checklist)
      return
    }
    setEditingChecklist(checklist)
    setChecklistForm({
      name: checklist.name,
      description: checklist.description || '',
      stage: checklist.stage,
      items: checklist.items || []
    })
    setShowChecklistForm(true)
  }

  function getActivityChecklistStatus(activity: Activity) {
    if (!activity.checklist_ids || activity.checklist_ids.length === 0) {
      return { icon: '⚠️', label: 'No checklists', class: 'text-amber-600' }
    }
    const linkedCount = activity.checklist_ids.length
    return { icon: '✅', label: `${linkedCount} checklist${linkedCount > 1 ? 's' : ''}`, class: 'text-green-600' }
  }

  // Get tour products using an activity
  function getProductsUsingActivity(activityId: string) {
    return tourProducts.filter(p => p.activity_ids?.includes(activityId))
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading company configuration...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🏢 Tour Configuration</h1>
              <p className="text-gray-500 text-sm">Manage activities, checklists, and tour products</p>
            </div>
            <Link
              href="/admin/tour-products/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              + New Tour Product
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'activities', label: 'Activities', icon: '🏃', count: activities.length },
            { id: 'checklists', label: 'Checklists', icon: '📋', count: checklists.length },
            { id: 'products', label: 'Tour Products', icon: '📦', count: tourProducts.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                setSelectedActivity(null)
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'activities' && (
          <>
            {/* Activities Panel */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Activities</h2>
                  <div className="flex gap-2">
                    {['all', 'system', 'custom'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`text-xs px-2 py-1 rounded ${
                          filterType === type ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="🔍 Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      setEditingActivity(null)
                      setActivityForm({ name: '', description: '', duration_minutes: 60, requires_checklist: true })
                      setShowActivityModal(true)
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    + New
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No activities found</p>
                  </div>
                ) : (
                  filteredActivities.map(activity => {
                    const status = getActivityChecklistStatus(activity)
                    const isSelected = selectedActivity?.id === activity.id
                    const productsUsing = getProductsUsingActivity(activity.id)
                    
                    return (
                      <div
                        key={activity.id}
                        onClick={() => setSelectedActivity(isSelected ? null : activity)}
                        className={`rounded-xl border p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🏃</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                                {activity.is_system ? (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                                ) : (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{activity.duration_minutes} min • {status.label}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!activity.is_system && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditActivity(activity) }}
                                className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                            {!activity.is_system && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteActivity(activity.id) }}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Products using this activity */}
                        {productsUsing.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Used in {productsUsing.length} tour product{productsUsing.length > 1 ? 's' : ''}
                          </div>
                        )}

                        {/* Linked checklists */}
                        {isSelected && activity.linked_checklists && activity.linked_checklists.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-2">Linked Checklists:</p>
                            <div className="space-y-1">
                              {activity.linked_checklists.map(checklist => (
                                <div key={checklist.id} className="flex items-center gap-2 text-sm">
                                  <span>📋</span>
                                  <span className="text-gray-700">{checklist.name}</span>
                                  {checklist.is_system && <span className="text-xs text-gray-400">(System)</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isSelected && (!activity.linked_checklists || activity.linked_checklists.length === 0) && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-amber-600">
                              ⚠️ No checklists linked. {activity.is_system ? 'System activities have fixed links.' : 'Select checklists on the right.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Checklists Panel */}
            <div className="w-1/2 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900 mb-3">Checklists by Stage</h2>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(stage => {
                    const count = checklists.filter(c => c.stage === stage.id).length
                    return (
                      <button
                        key={stage.id}
                        onClick={() => setActiveStage(stage.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                          activeStage === stage.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{stage.icon}</span>
                        <span>{stage.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeStage === stage.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedActivity && (
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">🎯 LINKING TO:</p>
                      <p className="font-semibold text-gray-900">{selectedActivity.name}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="text-sm text-blue-600 hover:text-blue-800">✕ Clear</button>
                  </div>
                  {!selectedActivity.is_system && (
                    <p className="text-xs text-gray-500 mt-1">Click 🔗 Link buttons to assign checklists</p>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-auto p-4">
                <button
                  onClick={() => {
                    setEditingChecklist(null)
                    setChecklistForm({ name: '', description: '', stage: activeStage, items: [] })
                    setShowChecklistForm(true)
                  }}
                  className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                >
                  <span>+</span>
                  <span>Create {STAGES.find(s => s.id === activeStage)?.label} Checklist</span>
                </button>

                {filteredChecklists.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No checklists for this stage</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredChecklists.map(checklist => {
                      const isLinked = selectedActivity && links.some(
                        l => l.activity_id === selectedActivity.id && l.checklist_id === checklist.id
                      )
                      
                      return (
                        <div key={checklist.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">📋</span>
                                <h3 className="font-medium text-gray-900">{checklist.name}</h3>
                                {checklist.is_system ? (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                                ) : (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {checklist.items?.length || 0} items • Used by {checklist.activity_count || 0} activities
                              </p>
                            </div>
                            
                            {selectedActivity && !selectedActivity.is_system && (
                              <button
                                onClick={() => toggleLink(selectedActivity.id, checklist.id)}
                                disabled={saving}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  isLinked ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isLinked ? '✓ Linked' : '🔗 Link'}
                              </button>
                            )}
                          </div>

                          {checklist.items && checklist.items.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {checklist.items.slice(0, 3).map((item, idx) => (
                                <span key={idx} className={`text-xs px-2 py-1 rounded-full border ${item.required ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                  {item.text.substring(0, 20)}{item.text.length > 20 ? '...' : ''}
                                  {item.photo_required && ' 📷'}
                                </span>
                              ))}
                              {checklist.items.length > 3 && (
                                <span className="text-xs text-gray-400 px-2 py-1">+{checklist.items.length - 3} more</span>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button onClick={() => openEditChecklist(checklist)} className="text-sm text-blue-600 hover:text-blue-800">
                              {checklist.is_system ? 'Duplicate' : 'Edit'}
                            </button>
                            {!checklist.is_system && (
                              <button onClick={() => deleteChecklist(checklist.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'checklists' && (
          <div className="flex-1 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Checklists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checklists.map(checklist => (
                <div key={checklist.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">📋</span>
                    {checklist.is_system ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{checklist.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{STAGES.find(s => s.id === checklist.stage)?.label}</p>
                  <p className="text-xs text-gray-400">{checklist.items?.length || 0} items</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Products</h2>
            {tourProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No tour products yet</p>
                <Link href="/admin/tour-products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Create First Tour Product
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tourProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/admin/tour-products/${product.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Service: {product.service_code}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {product.activity_ids?.length || 0} activities
                        </p>
                      </div>
                      <span className="text-blue-600">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals (same as super-admin version) */}
      {(showActivityModal || editingActivity) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{editingActivity ? 'Edit Activity' : 'Create Activity'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  value={activityForm.duration_minutes}
                  onChange={(e) => setActivityForm({ ...activityForm, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={5}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activityForm.requires_checklist}
                  onChange={(e) => setActivityForm({ ...activityForm, requires_checklist: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requires equipment checklist</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowActivityModal(false); setEditingActivity(null) }}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={editingActivity ? updateActivity : createActivity}
                disabled={saving || !activityForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingActivity ? 'Save Changes' : 'Create Activity')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Form Modal */}
      {showChecklistForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{editingChecklist ? 'Edit Checklist' : 'Create Checklist'}</h2>
            </div>
            <div className="p-6 space-y-4 overflow-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={checklistForm.stage}
                  onChange={(e) => setChecklistForm({ ...checklistForm, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.icon} {stage.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button onClick={addChecklistItem} className="text-sm text-blue-600 hover:text-blue-800">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {checklistForm.items.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateChecklistItem(index, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Item description"
                        />
                        <button onClick={() => removeChecklistItem(index)} className="text-red-600 hover:text-red-800 p-1">✕</button>
                      </div>
                      <div className="flex items-center gap-4 ml-6">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) => updateChecklistItem(index, 'required', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span>Required</span>
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={item.photo_required}
                            onChange={(e) => updateChecklistItem(index, 'photo_required', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span>Photo required 📷</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  {checklistForm.items.length === 0 && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm">No items yet</p>
                      <button onClick={addChecklistItem} className="text-blue-600 text-sm mt-1">+ Add first item</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowChecklistForm(false); setEditingChecklist(null) }}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={editingChecklist ? updateChecklist : createChecklist}
                disabled={saving || !checklistForm.name.trim() || checklistForm.items.length === 0}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingChecklist ? 'Save Changes' : 'Create Checklist')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
