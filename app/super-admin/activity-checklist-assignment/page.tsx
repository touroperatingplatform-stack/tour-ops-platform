'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Activity {
  id: string
  name: string
  duration_minutes: number
  default_checklist_template_id: string | null
}

interface Checklist {
  id: string
  name: string
  items: any[]
}

export default function ActivityChecklistAssignmentPage() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<string>>(new Set())
  const [bulkChecklistId, setBulkChecklistId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Load ALL system activities
    const { data: systemActivities } = await supabase
      .from('activities')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    // Load links
    const { data: links } = await supabase
      .from('activity_checklist_links')
      .select('activity_id, checklist_id')
      .eq('is_system', true)
    
    // Merge links into activities
    const activitiesWithLinks = (systemActivities || []).map(activity => ({
      ...activity,
      checklist_ids: links?.filter(l => l.activity_id === activity.id).map(l => l.checklist_id) || []
    }))
    
    // Load system checklists
    const { data: systemChecklists } = await supabase
      .from('checklists')
      .select('id, name, items')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    setActivities(activitiesWithLinks)
    setChecklists(systemChecklists || [])
    setLoading(false)
  }

  // Group activities by checklist
  const groupedActivities = checklists.map(checklist => ({
    checklist,
    activities: activities.filter(a => a.default_checklist_template_id === checklist.id)
  })).filter(g => g.activities.length > 0)

  // Unassigned activities
  const unassigned = activities.filter(a => !a.default_checklist_template_id)

  async function assignActivity(activityId: string, checklistId: string | null) {
    setSaving(true)
    
    if (checklistId) {
      // Create link
      const { error } = await supabase
        .from('activity_checklist_links')
        .insert({
          activity_id: activityId,
          checklist_id: checklistId,
          is_system: true
        })
        .onConflict(['activity_id', 'checklist_id'])
        .ignore()
      
      if (error) console.error('Link error:', error)
    } else {
      // Remove all links for this activity
      const { error } = await supabase
        .from('activity_checklist_links')
        .delete()
        .eq('activity_id', activityId)
        .eq('is_system', true)
      
      if (error) console.error('Unlink error:', error)
    }
    
    await loadData()
    setSaving(false)
  }

  async function bulkAssign() {
    if (!bulkChecklistId || selectedUnassigned.size === 0) return
    
    setSaving(true)
    const promises = Array.from(selectedUnassigned).map(activityId =>
      supabase
        .from('activities')
        .update({ default_checklist_template_id: bulkChecklistId })
        .eq('id', activityId)
    )
    
    await Promise.all(promises)
    await loadData()
    setSelectedUnassigned(new Set())
    setBulkChecklistId('')
    setSaving(false)
  }

  function toggleUnassigned(activityId: string) {
    const newSet = new Set(selectedUnassigned)
    if (newSet.has(activityId)) {
      newSet.delete(activityId)
    } else {
      newSet.add(activityId)
    }
    setSelectedUnassigned(newSet)
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
      <header className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Activity Checklist Assignment</h1>
              <p className="text-gray-500 text-sm">Assign equipment checklists to activities</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/super-admin/activities"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200"
              >
                Manage Activities
              </a>
              <a
                href="/super-admin/checklist-presets"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200"
              >
                Manage Checklists
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 space-y-6">
        {/* Checklists with Activities */}
        {groupedActivities.map(({ checklist, activities: assigned }) => (
          <div key={checklist.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h2 className="font-semibold text-gray-900">{checklist.name}</h2>
                    <p className="text-sm text-gray-500">{checklist.items?.length || 0} equipment items • {assigned.length} activities</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {assigned.map(activity => (
                <div key={activity.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏃</span>
                    <div>
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-500">{activity.duration_minutes} min</p>
                    </div>
                  </div>
                  <button
                    onClick={() => assignActivity(activity.id, null)}
                    disabled={saving}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Unassigned Activities */}
        {unassigned.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h2 className="font-semibold text-gray-900">Unassigned Activities</h2>
                    <p className="text-sm text-gray-500">{unassigned.length} activities need checklists</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {unassigned.map(activity => (
                <div key={activity.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUnassigned.has(activity.id)}
                      onChange={() => toggleUnassigned(activity.id)}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">🏃</span>
                    <div>
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-500">{activity.duration_minutes} min</p>
                    </div>
                  </div>
                  <select
                    value=""
                    onChange={(e) => assignActivity(activity.id, e.target.value || null)}
                    disabled={saving}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="">Quick assign...</option>
                    {checklists.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            {/* Bulk assign section */}
            {selectedUnassigned.size > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
                <span className="text-sm text-gray-600">{selectedUnassigned.size} selected:</span>
                <select
                  value={bulkChecklistId}
                  onChange={(e) => setBulkChecklistId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1"
                >
                  <option value="">Select checklist...</option>
                  {checklists.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={bulkAssign}
                  disabled={!bulkChecklistId || saving}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {groupedActivities.length === 0 && unassigned.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No activities found</p>
          </div>
        )}

        {/* All assigned success */}
        {groupedActivities.length > 0 && unassigned.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <span className="text-2xl">✅</span>
            <p className="font-medium text-green-800 mt-2">All activities have checklists assigned!</p>
          </div>
        )}
      </main>
    </div>
  )
}
