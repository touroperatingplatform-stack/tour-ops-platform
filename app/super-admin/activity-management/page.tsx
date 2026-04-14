'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Activity {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  is_active: boolean
}

interface Checklist {
  id: string
  name: string
  description: string | null
  items: any[]
  stage: string
}

interface ActivityChecklistLink {
  activity_id: string
  checklist_id: string
  stage: string
}

const STAGES = [
  { id: 'acknowledgement', label: 'Acknowledgement', icon: '👋' },
  { id: 'pre_departure', label: 'Pre-Departure', icon: '🚐' },
  { id: 'pre_pickup', label: 'Pre-Pickup', icon: '📍' },
  { id: 'activity', label: 'Activity', icon: '🎯' },
  { id: 'dropoff', label: 'Dropoff', icon: '🏁' },
  { id: 'finish', label: 'Finish', icon: '✅' }
]

export default function ActivityManagementPage() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [links, setLinks] = useState<ActivityChecklistLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showPresetManager, setShowPresetManager] = useState(false)
  const [addingToStage, setAddingToStage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: acts }, { data: chks }, { data: lks }] = await Promise.all([
      supabase.from('activities').select('*').is('company_id', null).eq('is_active', true).order('name'),
      supabase.from('checklists').select('*').is('company_id', null).eq('is_active', true).order('name'),
      supabase.from('activity_checklist_links').select('*').eq('is_system', true)
    ])
    setActivities(acts || [])
    setChecklists(chks || [])
    setLinks(lks || [])
    if (acts?.length && !selectedActivity) setSelectedActivity(acts[0])
    setLoading(false)
  }

  const activityLinks = selectedActivity 
    ? links.filter(l => l.activity_id === selectedActivity.id)
    : []

  function getChecklistsForStage(stageId: string) {
    return activityLinks
      .filter(l => l.stage === stageId)
      .map(l => checklists.find(c => c.id === l.checklist_id))
      .filter(Boolean)
  }

  async function assignChecklist(checklistId: string, stage: string) {
    if (!selectedActivity) return
    
    const { error } = await supabase.from('activity_checklist_links').insert({
      activity_id: selectedActivity.id,
      checklist_id: checklistId,
      stage,
      is_system: true
    })
    
    if (error) {
      console.error(error)
      alert('Failed to assign')
    } else {
      loadData()
      setAddingToStage(null)
    }
  }

  async function removeChecklist(checklistId: string, stage: string) {
    if (!selectedActivity) return
    
    const { error } = await supabase.from('activity_checklist_links')
      .delete()
      .eq('activity_id', selectedActivity.id)
      .eq('checklist_id', checklistId)
      .eq('stage', stage)
    
    if (!error) loadData()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity Management</h1>
          <p className="text-sm text-gray-500">Manage activities and their required checklists</p>
        </div>
        <button
          onClick={() => setShowPresetManager(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage Presets →
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Activities */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + New Activity
            </button>
          </div>
          {activities.map(act => (
            <button
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                selectedActivity?.id === act.id 
                  ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="font-medium text-gray-900 text-sm">{act.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{act.duration_minutes} min</div>
            </button>
          ))}
        </div>

        {/* Right: Checklists by Phase */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedActivity ? (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">{selectedActivity.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedActivity.description || 'No description'}</p>
              </div>

              <div className="space-y-6">
                {STAGES.map(stage => {
                  const stageChecklists = getChecklistsForStage(stage.id)
                  
                  return (
                    <div key={stage.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{stage.icon}</span>
                          <span className="font-medium text-gray-900">{stage.label}</span>
                        </div>
                        <button
                          onClick={() => setAddingToStage(stage.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Add
                        </button>
                      </div>
                      
                      <div className="p-4">
                        {stageChecklists.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No checklists assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {stageChecklists.map(chk => (
                              <div
                                key={chk!.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm text-gray-900">{chk!.name}</div>
                                  <div className="text-xs text-gray-500">{chk!.items?.length || 0} items</div>
                                </div>
                                <button
                                  onClick={() => removeChecklist(chk!.id, stage.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12">Select an activity</div>
          )}
        </div>
      </div>

      {/* Add Checklist Modal */}
      {addingToStage && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Add Checklist</h3>
              <p className="text-sm text-gray-500">{STAGES.find(s => s.id === addingToStage)?.label} phase</p>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {checklists
                .filter(c => c.stage === addingToStage)
                .filter(c => !activityLinks.some(l => 
                  l.activity_id === selectedActivity.id && 
                  l.checklist_id === c.id && 
                  l.stage === addingToStage
                ))
                .map(chk => (
                  <button
                    key={chk.id}
                    onClick={() => assignChecklist(chk.id, addingToStage)}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{chk.name}</div>
                    <div className="text-xs text-gray-500">{chk.items?.length || 0} items</div>
                  </button>
                ))}
              
              {checklists.filter(c => c.stage === addingToStage).length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No presets for this phase. Create one in preset manager.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setAddingToStage(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Manager Sidebar */}
      {showPresetManager && (
        <PresetManager 
          checklists={checklists}
          onClose={() => setShowPresetManager(false)}
          onUpdate={() => loadData()}
        />
      )}
    </div>
  )
}

// Separate component for preset manager
function PresetManager({ checklists, onClose, onUpdate }: { 
  checklists: Checklist[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [activeStage, setActiveStage] = useState('acknowledgement')
  const [editing, setEditing] = useState<Checklist | null>(null)

  const stageChecklists = checklists.filter(c => c.stage === activeStage)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white z-50 shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold">Checklist Presets</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {STAGES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                activeStage === s.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {stageChecklists.map(chk => (
            <div key={chk.id} className="p-3 border border-gray-200 rounded-lg mb-2">
              <div className="font-medium text-sm">{chk.name}</div>
              <div className="text-xs text-gray-500 mt-1">{chk.items?.length || 0} items</div>
            </div>
          ))}
          {stageChecklists.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No presets</p>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
            + New Preset
          </button>
        </div>
      </div>
    </>
  )
}
