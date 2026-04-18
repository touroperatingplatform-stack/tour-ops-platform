'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

// Types
interface Activity {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  requires_checklist: boolean
  is_active: boolean
  company_id: string | null
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

const STAGES = [
  { id: 'acknowledgement', label: 'Acknowledgement', icon: '👋', desc: 'Pre-tour guide confirmation' },
  { id: 'pre_departure', label: 'Pre-Departure', icon: '🚐', desc: 'Before leaving office' },
  { id: 'pre_pickup', label: 'Pre-Pickup', icon: '📍', desc: 'Before picking up guests' },
  { id: 'activity', label: 'Activity', icon: '🎯', desc: 'During tour activities' },
  { id: 'dropoff', label: 'Dropoff', icon: '🏁', desc: 'Guest dropoff phase' },
  { id: 'finish', label: 'Finish', icon: '✅', desc: 'Tour completion' }
]

export default function TourConfigurationPage() {
  const { t } = useTranslation()
  
  // Data states
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [links, setLinks] = useState<ActivityChecklistLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // UI states
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activeStage, setActiveStage] = useState('pre_departure')
  const [searchQuery, setSearchQuery] = useState('')
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

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // Load system activities
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    // Load system checklists
    const { data: checklistsData } = await supabase
      .from('checklists')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    // Load activity-checklist links
    const { data: linksData } = await supabase
      .from('activity_checklist_links')
      .select('activity_id, checklist_id')
      .eq('is_system', true)
    
    // Calculate activity counts for each checklist
    const checklistsWithCounts = (checklistsData || []).map(checklist => ({
      ...checklist,
      activity_count: linksData?.filter(l => l.checklist_id === checklist.id).length || 0
    }))
    
    // Merge links into activities
    const activitiesWithLinks = (activitiesData || []).map(activity => ({
      ...activity,
      checklist_ids: linksData?.filter(l => l.activity_id === activity.id).map(l => l.checklist_id) || [],
      linked_checklists: checklistsData?.filter(c => linksData?.some(l => l.activity_id === activity.id && l.checklist_id === c.id)) || []
    }))
    
    setActivities(activitiesWithLinks)
    setChecklists(checklistsWithCounts)
    setLinks(linksData || [])
    setLoading(false)
  }

  // Filter activities by search
  const filteredActivities = activities.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter checklists by stage
  const filteredChecklists = checklists.filter(c => c.stage === activeStage)

  // Check if activity has checklist linked
  function isLinked(activityId: string, checklistId: string) {
    return links.some(l => l.activity_id === activityId && l.checklist_id === checklistId)
  }

  // Toggle link between activity and checklist
  async function toggleLink(activityId: string, checklistId: string) {
    if (!activityId) return
    
    setSaving(true)
    
    if (isLinked(activityId, checklistId)) {
      // Remove link
      await supabase
        .from('activity_checklist_links')
        .delete()
        .eq('activity_id', activityId)
        .eq('checklist_id', checklistId)
        .eq('is_system', true)
    } else {
      // Add link
      await supabase
        .from('activity_checklist_links')
        .insert({
          activity_id: activityId,
          checklist_id: checklistId,
          is_system: true
        })
    }
    
    await loadData()
    setSaving(false)
  }

  // Create new activity
  async function createActivity() {
    if (!activityForm.name.trim()) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('activities')
      .insert({
        name: activityForm.name,
        description: activityForm.description || null,
        duration_minutes: activityForm.duration_minutes,
        requires_checklist: activityForm.requires_checklist,
        is_active: true,
        company_id: null
      })
    
    if (!error) {
      setShowActivityModal(false)
      setActivityForm({ name: '', description: '', duration_minutes: 60, requires_checklist: true })
      await loadData()
    }
    
    setSaving(false)
  }

  // Update activity
  async function updateActivity() {
    if (!editingActivity || !activityForm.name.trim()) return
    
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
      await loadData()
    }
    
    setSaving(false)
  }

  // Delete activity (soft delete)
  async function deleteActivity(activityId: string) {
    if (!confirm('Delete this system activity?')) return
    
    setSaving(true)
    
    await supabase
      .from('activities')
      .update({ is_active: false })
      .eq('id', activityId)
    
    if (selectedActivity?.id === activityId) {
      setSelectedActivity(null)
    }
    
    await loadData()
    setSaving(false)
  }

  // Create new checklist
  async function createChecklist() {
    if (!checklistForm.name.trim() || checklistForm.items.length === 0) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('checklists')
      .insert({
        name: checklistForm.name,
        description: checklistForm.description || null,
        stage: checklistForm.stage,
        items: checklistForm.items.filter(i => i.text.trim()),
        is_active: true,
        company_id: null
      })
    
    if (!error) {
      setShowChecklistForm(false)
      setChecklistForm({ name: '', description: '', stage: 'pre_departure', items: [] })
      await loadData()
    }
    
    setSaving(false)
  }

  // Update checklist
  async function updateChecklist() {
    if (!editingChecklist || !checklistForm.name.trim()) return
    
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
      await loadData()
    }
    
    setSaving(false)
  }

  // Delete checklist (soft delete)
  async function deleteChecklist(checklistId: string) {
    if (!confirm('Delete this system checklist?')) return
    
    setSaving(true)
    
    await supabase
      .from('checklists')
      .update({ is_active: false })
      .eq('id', checklistId)
    
    await loadData()
    setSaving(false)
  }

  // Duplicate checklist
  async function duplicateChecklist(checklist: Checklist) {
    setSaving(true)
    
    await supabase
      .from('checklists')
      .insert({
        name: `${checklist.name} (Copy)`,
        description: checklist.description,
        stage: checklist.stage,
        items: checklist.items,
        is_active: true,
        company_id: null
      })
    
    await loadData()
    setSaving(false)
  }

  // Add item to checklist form
  function addChecklistItem() {
    setChecklistForm(prev => ({
      ...prev,
      items: [...prev.items, {
        id: crypto.randomUUID(),
        text: '',
        required: true,
        photo_required: false
      }]
    }))
  }

  // Update checklist item
  function updateChecklistItem(index: number, field: keyof ChecklistItem, value: any) {
    setChecklistForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Remove checklist item
  function removeChecklistItem(index: number) {
    setChecklistForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Open edit activity
  function openEditActivity(activity: Activity) {
    setEditingActivity(activity)
    setActivityForm({
      name: activity.name,
      description: activity.description || '',
      duration_minutes: activity.duration_minutes,
      requires_checklist: activity.requires_checklist
    })
  }

  // Open edit checklist
  function openEditChecklist(checklist: Checklist) {
    setEditingChecklist(checklist)
    setChecklistForm({
      name: checklist.name,
      description: checklist.description || '',
      stage: checklist.stage,
      items: checklist.items || []
    })
    setShowChecklistForm(true)
  }

  // Get checklist status for activity
  function getActivityChecklistStatus(activity: Activity) {
    if (!activity.checklist_ids || activity.checklist_ids.length === 0) {
      return { icon: '❌', label: 'No checklists', class: 'text-red-600' }
    }
    
    const linkedCount = activity.checklist_ids.length
    return { 
      icon: '✅', 
      label: `${linkedCount} checklist${linkedCount > 1 ? 's' : ''}`, 
      class: 'text-green-600' 
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading tour configuration...</div>
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
              <h1 className="text-xl font-bold text-gray-900">🏢 Tour System Configuration</h1>
              <p className="text-gray-500 text-sm">Manage system activities and checklists for all companies</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingActivity(null)
                  setActivityForm({ name: '', description: '', duration_minutes: 60, requires_checklist: true })
                  setShowActivityModal(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                + New Activity
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Panel - Activities */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
          {/* Activities Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">📋 Activities ({activities.length})</h2>
            </div>
            <input
              type="text"
              placeholder="🔍 Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Activities List */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities found</p>
              </div>
            ) : (
              filteredActivities.map(activity => {
                const status = getActivityChecklistStatus(activity)
                const isSelected = selectedActivity?.id === activity.id
                
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
                    {/* Activity Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏃</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                          <p className="text-xs text-gray-500">{activity.duration_minutes} min • {status.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditActivity(activity)
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          title="Edit activity"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteActivity(activity.id)
                          }}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                          title="Delete activity"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Expanded View - Show Linked Checklists */}
                    {isSelected && activity.linked_checklists && activity.linked_checklists.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-700 mb-2">Linked Checklists:</p>
                        <div className="space-y-1">
                          {activity.linked_checklists.map(checklist => (
                            <div key={checklist.id} className="flex items-center gap-2 text-sm">
                              <span>📋</span>
                              <span className="text-gray-700">{checklist.name}</span>
                              <span className="text-xs text-gray-400">({STAGES.find(s => s.id === checklist.stage)?.label})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSelected && (!activity.linked_checklists || activity.linked_checklists.length === 0) && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-amber-600">⚠️ No checklists linked. Select checklists on the right.</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel - Checklists */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* Stage Tabs */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-3">📋 Checklists by Stage</h2>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(stage => {
                const count = checklists.filter(c => c.stage === stage.id).length
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      activeStage === stage.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeStage === stage.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Activity Banner */}
          {selectedActivity && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">🎯 LINKING TO:</p>
                  <p className="font-semibold text-gray-900">{selectedActivity.name}</p>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ✕ Clear
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click 🔗 Link buttons below to assign checklists
              </p>
            </div>
          )}

          {/* Checklists List */}
          <div className="flex-1 overflow-auto p-4">
            {/* Create Checklist Button */}
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

            {/* Checklists */}
            {filteredChecklists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No checklists for this stage</p>
                <p className="text-sm">Create one above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChecklists.map(checklist => {
                  const isLinked = selectedActivity && links.some(
                    l => l.activity_id === selectedActivity.id && l.checklist_id === checklist.id
                  )
                  
                  return (
                    <div key={checklist.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300">
                      {/* Checklist Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <h3 className="font-medium text-gray-900">{checklist.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {checklist.items?.length || 0} items • Used by {checklist.activity_count || 0} activities
                          </p>
                        </div>
                        
                        {/* Link Button */}
                        {selectedActivity && (
                          <button
                            onClick={() => toggleLink(selectedActivity.id, checklist.id)}
                            disabled={saving}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isLinked
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isLinked ? '✓ Linked' : '🔗 Link'}
                          </button>
                        )}
                      </div>

                      {/* Items Preview */}
                      {checklist.items && checklist.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {checklist.items.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full border ${
                                item.required
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-gray-100 border-gray-200 text-gray-600'
                              }`}
                            >
                              {item.text.substring(0, 20)}{item.text.length > 20 ? '...' : ''}
                              {item.photo_required && ' 📷'}
                            </span>
                          ))}
                          {checklist.items.length > 3 && (
                            <span className="text-xs text-gray-400 px-2 py-1">
                              +{checklist.items.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditChecklist(checklist)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => duplicateChecklist(checklist)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteChecklist(checklist.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Activity Modal */}
      {(showActivityModal || editingActivity) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingActivity ? 'Edit Activity' : 'Create Activity'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Snorkeling Activity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="What this activity involves"
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
                onClick={() => {
                  setShowActivityModal(false)
                  setEditingActivity(null)
                }}
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
              <h2 className="text-xl font-bold text-gray-900">
                {editingChecklist ? 'Edit Checklist' : 'Create Checklist'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {STAGES.find(s => s.id === checklistForm.stage)?.label} checklist
              </p>
            </div>

            <div className="p-6 space-y-4 overflow-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Snorkeling Gear Check"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={checklistForm.description}
                  onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
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
                    <option key={stage.id} value={stage.id}>
                      {stage.icon} {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button
                    onClick={addChecklistItem}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Item
                  </button>
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
                          placeholder="e.g., Life jackets checked"
                        />
                        <button
                          onClick={() => removeChecklistItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          ✕
                        </button>
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
                      <button
                        onClick={addChecklistItem}
                        className="text-blue-600 text-sm mt-1"
                      >
                        + Add first item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChecklistForm(false)
                  setEditingChecklist(null)
                }}
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
