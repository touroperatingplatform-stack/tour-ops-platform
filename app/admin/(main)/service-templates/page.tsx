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
  stage: string
  items: any[]
}

interface ActivityChecklistLink {
  activity_id: string
  checklist_id: string
  checklists: Checklist[]
}

const STAGES = [
  { id: 'pre_departure', label: 'Pre-Departure', icon: '🚌', description: 'Before leaving office' },
  { id: 'pre_pickup', label: 'Pre-Pickup', icon: '📍', description: 'At pickup locations' },
  { id: 'activity', label: 'Activity', icon: '🏃', description: 'During tour activities' },
  { id: 'dropoff', label: 'Dropoff', icon: '🏨', description: 'Returning guests' },
  { id: 'finish', label: 'Finish', icon: '✅', description: 'Back at office' }
]

export default function ServiceTemplatesPage() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [links, setLinks] = useState<ActivityChecklistLink[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

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

    // Load service templates (servicio_patterns)
    const { data: templatesData } = await supabase
      .from('servicio_patterns')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('servicio_name')

    // Load activities
    const [{ data: systemActivities }, { data: companyActivities }] = await Promise.all([
      supabase.from('activities').select('id, name, duration_minutes').is('company_id', null).eq('is_active', true),
      supabase.from('activities').select('id, name, duration_minutes').eq('company_id', profile.company_id).eq('is_active', true)
    ])

    // Load checklists
    const [{ data: systemChecklists }, { data: companyChecklists }] = await Promise.all([
      supabase.from('checklists').select('id, name, stage, items').is('company_id', null).eq('is_active', true),
      supabase.from('checklists').select('id, name, stage, items').eq('company_id', profile.company_id).eq('is_active', true)
    ])

    // Load activity-checklist links
    const [{ data: systemLinks }, { data: companyLinks }] = await Promise.all([
      supabase.from('activity_checklist_links').select('activity_id, checklist_id, checklists(id, name, stage, items)').eq('is_system', true),
      supabase.from('activity_checklist_links').select('activity_id, checklist_id, checklists(id, name, stage, items)').eq('is_system', false)
    ])

    setTemplates(templatesData || [])
    setActivities([...(systemActivities || []), ...(companyActivities || [])])
    setChecklists([...(systemChecklists || []), ...(companyChecklists || [])])
    
    const allLinks = [...(systemLinks || []), ...(companyLinks || [])].map(l => ({
      activity_id: l.activity_id,
      checklist_id: l.checklist_id,
      checklists: l.checklists || []
    })) as ActivityChecklistLink[]
    setLinks(allLinks)
    
    setLoading(false)
  }

  function getTemplateActivities(template: ServiceTemplate) {
    return template.activities.map(id => activities.find(a => a.id === id)).filter(Boolean) as Activity[]
  }

  function getActivityChecklists(activityId: string) {
    return links
      .filter(l => l.activity_id === activityId)
      .flatMap(l => l.checklists || [])
  }

  function getStageChecklists(stageId: string, activityId?: string) {
    if (activityId) {
      // Activity-specific checklists
      return getActivityChecklists(activityId).filter(c => c.stage === stageId)
    }
    // General stage checklists (not activity-specific, e.g., pre_departure, finish)
    return checklists.filter(c => c.stage === stageId)
  }

  function calculateCoverage(template: ServiceTemplate) {
    const templateActivities = getTemplateActivities(template)
    const counts: Record<string, number> = {}
    
    STAGES.forEach(stage => {
      if (stage.id === 'activity') {
        // Count activity-specific checklists
        counts[stage.id] = templateActivities.reduce((sum, act) => {
          return sum + getActivityChecklists(act.id).filter(c => c.stage === 'activity').length
        }, 0)
      } else {
        // Count general stage checklists
        counts[stage.id] = checklists.filter(c => c.stage === stage.id).length
      }
    })
    
    return counts
  }

  async function saveTemplate(template: ServiceTemplate, updates: Partial<ServiceTemplate>) {
    setSaving(true)
    await supabase
      .from('servicio_patterns')
      .update(updates)
      .eq('id', template.id)
    await loadData()
    setSaving(false)
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
              <h1 className="text-xl font-bold text-gray-900">Service Templates</h1>
              <p className="text-gray-500 text-sm">Configure checklists for each service type</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {!selectedTemplate ? (
          /* Template List View */
          <div className="space-y-4 max-w-4xl">
            {templates.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No service templates yet. Import an ORDEN file to create templates.</p>
              </div>
            ) : (
              templates.map(template => {
                const coverage = calculateCoverage(template)
                const totalChecklists = Object.values(coverage).reduce((a, b) => a + b, 0)
                
                return (
                  <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="font-semibold text-lg text-gray-900">{template.servicio_name}</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            {getTemplateActivities(template).length} activities • {template.duration_minutes || '—'} min
                          </p>
                          
                          {/* Coverage Summary */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {STAGES.map(stage => {
                              const count = coverage[stage.id]
                              const hasCoverage = count > 0
                              return (
                                <span 
                                  key={stage.id}
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    hasCoverage 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {stage.icon} {stage.label}: {count}
                                </span>
                              )
                            })}
                          </div>
                          
                          {/* Warnings */}
                          {totalChecklists === 0 && (
                            <p className="text-sm text-amber-600 mt-2">⚠️ No checklists configured</p>
                          )}
                          {coverage.pre_departure === 0 && (
                            <p className="text-sm text-amber-600 mt-2">⚠️ Missing pre-departure checklists</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* Template Detail View */
          <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200"
              >
                ← Back to List
              </button>
              <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.servicio_name}</h2>
            </div>

            {/* Stages Configuration */}
            {STAGES.map(stage => {
              const templateActivities = getTemplateActivities(selectedTemplate)
              
              return (
                <div key={stage.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stage.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                        <p className="text-sm text-gray-500">{stage.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {stage.id === 'activity' ? (
                      /* Activity-specific checklists */
                      <div className="space-y-4">
                        {templateActivities.length === 0 ? (
                          <p className="text-sm text-gray-500">No activities configured for this template</p>
                        ) : (
                          templateActivities.map(activity => {
                            const activityChecklists = getActivityChecklists(activity.id)
                            const stageChecklists = activityChecklists.filter(c => c.stage === 'activity')
                            
                            return (
                              <div key={activity.id} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{activity.name}</p>
                                    <p className="text-sm text-gray-500">{activity.duration_minutes} min</p>
                                  </div>
                                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {stageChecklists.length} checklists
                                  </span>
                                </div>
                                
                                {/* Activity Checklists */}
                                <div className="space-y-2">
                                  {stageChecklists.map(checklist => (
                                    <div key={checklist.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                      <span className="text-sm">📋 {checklist.name}</span>
                                      <button className="text-red-600 text-sm hover:text-red-800">
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                
                                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                                  + Add Checklist
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    ) : (
                      /* General stage checklists */
                      <div className="space-y-2">
                        {checklists.filter(c => c.stage === stage.id).map(checklist => (
                          <div key={checklist.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={true}
                                readOnly
                                className="w-4 h-4"
                              />
                              <span className="text-sm">📋 {checklist.name}</span>
                              <span className="text-xs text-gray-400">({checklist.items?.length || 0} items)</span>
                            </div>
                            <button
                              onClick={() => alert('Edit checklist: ' + checklist.name)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                        
                        {checklists.filter(c => c.stage === stage.id).length === 0 && (
                          <p className="text-sm text-gray-400 italic">No checklists assigned to this stage</p>
                        )}
                        
                        <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                          + Assign Checklist to {stage.label}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Coverage Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Template Coverage Summary</h3>
              {(() => {
                const coverage = calculateCoverage(selectedTemplate)
                const total = Object.values(coverage).reduce((a, b) => a + b, 0)
                
                return (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {STAGES.map(stage => (
                        <div key={stage.id} className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-2xl mb-1">{stage.icon}</div>
                          <div className="text-lg font-semibold">{coverage[stage.id]}</div>
                          <div className="text-xs text-gray-500">{stage.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Total Checklists: {total}</span>
                      
                      {/* Warnings */}
                      <div className="flex gap-2">
                        {coverage.pre_departure === 0 && (
                          <span className="text-sm text-amber-600">⚠️ Missing pre-departure</span>
                        )}
                        {total === 0 && (
                          <span className="text-sm text-red-600">❌ No checklists configured</span>
                        )}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
