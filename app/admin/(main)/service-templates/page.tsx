'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import Link from 'next/link'

interface ServiceTemplate {
  id: string
  servicio_name: string
  normalized_name: string
  activities: string[]
  duration_minutes: number
  company_id: string | null
  created_at: string
}

interface Activity {
  id: string
  name: string
  duration_minutes: number
}

interface Checklist {
  id: string
  name: string
  items: any[]
}

interface ActivityChecklistLink {
  activity_id: string
  checklist_id: string
  checklist: Checklist
}

export default function ServiceTemplatesPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'system' | 'company'>('company')
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [systemTemplates, setSystemTemplates] = useState<ServiceTemplate[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [systemActivities, setSystemActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [systemChecklists, setSystemChecklists] = useState<Checklist[]>([])
  const [links, setLinks] = useState<ActivityChecklistLink[]>([])
  const [systemLinks, setSystemLinks] = useState<ActivityChecklistLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  // Modal state
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [showConfigure, setShowConfigure] = useState(false)
  const [activityChecklists, setActivityChecklists] = useState<Record<string, string[]>>({})
  const [universalChecklists, setUniversalChecklists] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    // Load company templates
    const { data: companyTemplates } = await supabase
      .from('servicio_patterns')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('servicio_name')

    // Load system templates (presets)
    const { data: sysTemplates } = await supabase
      .from('servicio_patterns')
      .select('*')
      .is('company_id', null)
      .order('servicio_name')

    // Load company activities
    const { data: companyActivitiesData } = await supabase
      .from('activities')
      .select('id, name, duration_minutes')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)

    // Load system activities
    const { data: sysActivitiesData } = await supabase
      .from('activities')
      .select('id, name, duration_minutes')
      .is('company_id', null)
      .eq('is_active', true)

    // Load company checklists
    const { data: companyChecklistsData } = await supabase
      .from('checklists')
      .select('id, name, items')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)

    // Load system checklists
    const { data: sysChecklistsData } = await supabase
      .from('checklists')
      .select('id, name, items')
      .is('company_id', null)
      .eq('is_active', true)

    // Load company activity-checklist links
    const { data: companyLinksData } = await supabase
      .from('activity_checklist_links')
      .select('activity_id, checklist_id, checklists(id, name, items)')
      .eq('is_system', false)

    // Load system activity-checklist links
    const { data: sysLinksData } = await supabase
      .from('activity_checklist_links')
      .select('activity_id, checklist_id, checklists(id, name, items)')
      .eq('is_system', true)

    setTemplates(companyTemplates || [])
    setSystemTemplates(sysTemplates || [])
    setActivities(companyActivitiesData || [])
    setSystemActivities(sysActivitiesData || [])
    setChecklists(companyChecklistsData || [])
    setSystemChecklists(sysChecklistsData || [])
    
    const allCompanyLinks = (companyLinksData || []).map((l: any) => ({
      activity_id: l.activity_id,
      checklist_id: l.checklist_id,
      checklist: l.checklists?.[0] || null
    })).filter((l: ActivityChecklistLink) => l.checklist) as ActivityChecklistLink[]
    
    const allSystemLinks = (sysLinksData || []).map((l: any) => ({
      activity_id: l.activity_id,
      checklist_id: l.checklist_id,
      checklist: l.checklists?.[0] || null
    })).filter((l: ActivityChecklistLink) => l.checklist) as ActivityChecklistLink[]
    
    setLinks(allCompanyLinks)
    setSystemLinks(allSystemLinks)
    
    setLoading(false)
  }

  function getTemplateActivities(template: ServiceTemplate) {
    const allActivities = template.company_id ? activities : systemActivities
    return template.activities
      .map(id => allActivities.find(a => a.id === id))
      .filter(Boolean) as Activity[]
  }

  function getActivityChecklists(activityId: string, isSystem: boolean) {
    const allLinks = isSystem ? systemLinks : links
    return allLinks.filter(l => l.activity_id === activityId).map(l => l.checklist)
  }

  async function cloneTemplate(template: ServiceTemplate) {
    if (!companyId) return
    
    setSaving(true)
    
    // Clone to company
    const { error } = await supabase
      .from('servicio_patterns')
      .insert({
        company_id: companyId,
        servicio_name: template.servicio_name,
        normalized_name: template.normalized_name,
        activities: template.activities,
        duration_minutes: template.duration_minutes
      })
    
    if (error) {
      alert('Error cloning: ' + error.message)
    } else {
      await loadData()
      setActiveTab('company')
    }
    
    setSaving(false)
  }

  async function deleteTemplate(template: ServiceTemplate) {
    if (!confirm(`Delete "${template.servicio_name}"?`)) return
    
    setSaving(true)
    await supabase.from('servicio_patterns').delete().eq('id', template.id)
    await loadData()
    setSaving(false)
  }

  function openConfigure(template: ServiceTemplate) {
    setSelectedTemplate(template)
    
    // Initialize activity checklists from existing links
    const templateActivities = getTemplateActivities(template)
    const initialActivityChecklists: Record<string, string[]> = {}
    
    templateActivities.forEach(activity => {
      const activityChecklists = getActivityChecklists(activity.id, !template.company_id)
      initialActivityChecklists[activity.id] = activityChecklists.map(c => c.id)
    })
    
    setActivityChecklists(initialActivityChecklists)
    setUniversalChecklists([]) // TODO: Load universal checklists
    setShowConfigure(true)
  }

  async function saveConfiguration() {
    if (!selectedTemplate) return
    
    setSaving(true)
    
    // Save activity-checklist links
    for (const [activityId, checklistIds] of Object.entries(activityChecklists)) {
      // Delete existing links for this activity
      await supabase
        .from('activity_checklist_links')
        .delete()
        .eq('activity_id', activityId)
        .eq('is_system', false)
      
      // Insert new links
      if (checklistIds.length > 0) {
        await supabase
          .from('activity_checklist_links')
          .insert(
            checklistIds.map(checklistId => ({
              activity_id: activityId,
              checklist_id: checklistId,
              is_system: false
            }))
          )
      }
    }
    
    setSaving(false)
    setShowConfigure(false)
    setSelectedTemplate(null)
    await loadData()
  }

  function toggleActivityChecklist(activityId: string, checklistId: string) {
    setActivityChecklists(prev => {
      const current = prev[activityId] || []
      if (current.includes(checklistId)) {
        return { ...prev, [activityId]: current.filter(id => id !== checklistId) }
      } else {
        return { ...prev, [activityId]: [...current, checklistId] }
      }
    })
  }

  function getAvailableChecklists(activityId: string, isSystem: boolean) {
    const allChecklists = isSystem ? systemChecklists : checklists
    const currentIds = activityChecklists[activityId] || []
    return allChecklists.filter(c => !currentIds.includes(c.id))
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const currentTemplates = activeTab === 'system' ? systemTemplates : templates

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Service Templates</h1>
              <p className="text-gray-500 text-sm">Manage activities and checklists for tour services</p>
            </div>
            <Link href="/admin" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200">
              ← Back
            </Link>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'system' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔧 System Presets
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'company' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 My Company
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto border-8 border-transparent">
        <div className="max-w-4xl space-y-4">
          {currentTemplates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                {activeTab === 'system' 
                  ? 'No system presets available.' 
                  : 'No templates yet. Clone from System Presets or import an ORDEN file.'}
              </p>
            </div>
          ) : (
            currentTemplates.map(template => {
              const templateActivities = getTemplateActivities(template)
              const isSystem = !template.company_id
              
              return (
                <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="font-semibold text-lg text-gray-900">{template.servicio_name}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {templateActivities.length} activities
                          {template.duration_minutes && ` • ${template.duration_minutes} min`}
                        </p>
                        
                        {/* Activity list */}
                        <div className="mt-3 space-y-1">
                          {templateActivities.map(activity => {
                            const activityChecklists = getActivityChecklists(activity.id, isSystem)
                            return (
                              <div key={activity.id} className="flex items-center gap-2 text-sm">
                                <span>🏃 {activity.name}</span>
                                <span className="text-gray-400">({activity.duration_minutes} min)</span>
                                {activityChecklists.length > 0 && (
                                  <span className="text-green-600">
                                    • {activityChecklists.length} checklists
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isSystem ? (
                          <button
                            onClick={() => cloneTemplate(template)}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Cloning...' : 'Clone →'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openConfigure(template)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => deleteTemplate(template)}
                              disabled={saving}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {activeTab === 'company' && (
            <button className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200">
              + Create Template from Scratch
            </button>
          )}
        </div>
      </main>

      {/* Configure Modal */}
      {showConfigure && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Configure: {selectedTemplate.servicio_name}</h2>
              <button 
                onClick={() => setShowConfigure(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Activities */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Activities</h3>
                <div className="space-y-4">
                  {getTemplateActivities(selectedTemplate).map(activity => {
                    const currentChecklists = activityChecklists[activity.id] || []
                    const availableChecklists = getAvailableChecklists(activity.id, false)
                    
                    return (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{activity.name}</p>
                            <p className="text-sm text-gray-500">{activity.duration_minutes} min</p>
                          </div>
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {currentChecklists.length} checklists
                          </span>
                        </div>
                        
                        {/* Selected checklists */}
                        <div className="space-y-2 mb-2">
                          {currentChecklists.map(checklistId => {
                            const checklist = checklists.find(c => c.id === checklistId)
                            if (!checklist) return null
                            return (
                              <div key={checklistId} className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                                <span className="text-sm">📋 {checklist.name}</span>
                                <button 
                                  onClick={() => toggleActivityChecklist(activity.id, checklistId)}
                                  className="text-red-600 text-sm hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Add dropdown */}
                        {availableChecklists.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                toggleActivityChecklist(activity.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">+ Add checklist...</option>
                            {availableChecklists.map(c => (
                              <option key={c.id} value={c.id}>📋 {c.name}</option>
                            ))}
                          </select>
                        )}
                        
                        {currentChecklists.length === 0 && availableChecklists.length === 0 && (
                          <p className="text-sm text-gray-400 italic">No checklists available</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Universal Checklists */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Universal Checklists (Applies to all tours)</h3>
                <p className="text-sm text-gray-500 mb-3">These checklists apply to every tour with this service type</p>
                
                {/* TODO: Implement universal checklists */}
                <p className="text-sm text-gray-400 italic">Universal checklists coming soon...</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowConfigure(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
