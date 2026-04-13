'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ChecklistItem {
  id: string
  text: string
  required: boolean
  photo_required: boolean
}

interface Checklist {
  id: string
  name: string
  description: string | null
  items: ChecklistItem[]
  is_active: boolean
  company_id: string | null
  created_at: string
}

interface Activity {
  id: string
  name: string
  description: string | null
  checklist_template_id: string | null
  checklist_templates?: { name: string } | null
}

export default function AdminChecklistsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('presets')
  const [systemPresets, setSystemPresets] = useState<Checklist[]>([])
  const [companyChecklists, setCompanyChecklists] = useState<Checklist[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cloningFrom, setCloningFrom] = useState<Checklist | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as ChecklistItem[]
  })

  useEffect(() => {
    loadCompanyId()
  }, [])

  useEffect(() => {
    if (companyId) {
      loadData()
    }
  }, [companyId])

  async function loadCompanyId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id)
    }
  }

  async function loadData() {
    setLoading(true)
    
    // Load system presets (null company_id)
    const { data: presets } = await supabase
      .from('checklists')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    setSystemPresets(presets || [])
    
    // Load company checklists
    const { data: company } = await supabase
      .from('checklists')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    setCompanyChecklists(company || [])
    
    // Load activities with their checklists
    const { data: acts } = await supabase
      .from('activities')
      .select('*, checklist_templates(name)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')
    
    setActivities(acts || [])
    setLoading(false)
  }

  function openCreate() {
    setModalMode('create')
    setEditingId(null)
    setCloningFrom(null)
    setFormData({
      name: '',
      description: '',
      items: []
    })
    setShowModal(true)
  }

  function openClone(preset: Checklist) {
    setModalMode('clone')
    setEditingId(null)
    setCloningFrom(preset)
    setFormData({
      name: `${preset.name} (Copy)`,
      description: preset.description || '',
      items: preset.items ? [...preset.items.map(item => ({ ...item, id: crypto.randomUUID() }))] : []
    })
    setShowModal(true)
  }

  function openEdit(checklist: Checklist) {
    setModalMode('edit')
    setEditingId(checklist.id)
    setCloningFrom(null)
    setFormData({
      name: checklist.name,
      description: checklist.description || '',
      items: checklist.items ? [...checklist.items] : []
    })
    setShowModal(true)
  }

  function addItem() {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: crypto.randomUUID(),
        text: '',
        required: true,
        photo_required: false
      }]
    }))
  }

  function updateItem(index: number, field: keyof ChecklistItem, value: any) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  function removeItem(index: number) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item')
      return
    }

    const validItems = formData.items.filter(item => item.text.trim())

    if (modalMode === 'edit' && editingId) {
      const { error } = await supabase
        .from('checklists')
        .update({
          name: formData.name,
          description: formData.description || null,
          items: validItems
        })
        .eq('id', editingId)

      if (error) {
        alert('Error updating checklist')
        return
      }
    } else {
      // Create new (or clone)
      const { error } = await supabase
        .from('checklists')
        .insert({
          name: formData.name,
          description: formData.description || null,
          items: validItems,
          is_active: true,
          company_id: companyId
        })

      if (error) {
        alert('Error creating checklist')
        return
      }
    }

    setShowModal(false)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this checklist?')) return

    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Cannot delete - checklist may be in use by tours')
    } else {
      loadData()
    }
  }

  async function updateActivityChecklist(activityId: string, checklistId: string) {
    const { error } = await supabase
      .from('activities')
      .update({ checklist_template_id: checklistId || null })
      .eq('id', activityId)

    if (error) {
      alert('Error updating activity')
    } else {
      loadData()
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
      <header className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('checklists.title')}</h1>
              <p className="text-gray-500 text-sm">
                Manage equipment checklists and activity assignments • 
                <a href="/admin/activities" className="text-blue-600 hover:underline">Go to Activities →</a>
              </p>
            </div>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              + {t('common.add')}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-6">
          {[
            { id: 'presets', label: 'System Presets', count: systemPresets.length },
            { id: 'custom', label: 'My Checklists', count: companyChecklists.length },
            { id: 'activities', label: 'Activities', count: activities.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        {/* System Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>System Presets</strong> are industry-standard checklists created by the platform. 
                You can clone them to customize for your company.
              </p>
            </div>

            {systemPresets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No system presets available</div>
            ) : (
              <div className="grid gap-4">
                {systemPresets.map(preset => (
                  <div key={preset.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">System</span>
                        </div>
                        {preset.description && (
                          <p className="text-gray-500 text-sm mt-1">{preset.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preset.items?.slice(0, 5).map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {item.text}
                              {item.photo_required && '📷'}
                            </span>
                          ))}
                          {(preset.items?.length || 0) > 5 && (
                            <span className="text-xs text-gray-500">+{preset.items.length - 5} more</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openClone(preset)}
                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Clone & Customize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Checklists Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {companyChecklists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No custom checklists yet</p>
                <button
                  onClick={openCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create your first checklist
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {companyChecklists.map(checklist => (
                  <div key={checklist.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                        </div>
                        {checklist.description && (
                          <p className="text-gray-500 text-sm mt-1">{checklist.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {checklist.items?.slice(0, 5).map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {item.text}
                              {item.photo_required && '📷'}
                            </span>
                          ))}
                          {(checklist.items?.length || 0) > 5 && (
                            <span className="text-xs text-gray-500">+{checklist.items.length - 5} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openEdit(checklist)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(checklist.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">
                  <strong>Activities</strong> can have equipment checklists assigned to them.
                </p>
                <p className="text-green-700 text-sm mt-1">
                  When tours include these activities, guides will see the combined equipment list.
                </p>
              </div>
              <a 
                href="/admin/activities"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap"
              >
                Manage Activities →
              </a>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No activities found</div>
            ) : (
              <div className="grid gap-4">
                {activities.map(activity => (
                  <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏃</span>
                          <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                        </div>
                        {activity.description && (
                          <p className="text-gray-500 text-sm mt-1">{activity.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Equipment:</span>
                        <select
                          value={activity.checklist_template_id || ''}
                          onChange={(e) => updateActivityChecklist(activity.id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">None</option>
                          {[...systemPresets, ...companyChecklists].map(checklist => (
                            <option key={checklist.id} value={checklist.id}>
                              {checklist.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'edit' ? 'Edit Checklist' : 
                 modalMode === 'clone' ? 'Clone & Customize' : 'New Checklist'}
              </h2>
              {cloningFrom && (
                <p className="text-gray-500 text-sm mt-1">
                  Cloning from: {cloningFrom.name}
                </p>
              )}
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Snorkeling Checklist"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this checklist is for"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Checklist Items
                  </label>
                  <button
                    onClick={addItem}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem(index, 'text', e.target.value)}
                          placeholder="e.g., Life jackets"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) => updateItem(index, 'required', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.photo_required}
                            onChange={(e) => updateItem(index, 'photo_required', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Photo required 📷</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No items yet. Click "Add Item" to create checklist items.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                {modalMode === 'edit' ? 'Save Changes' : modalMode === 'clone' ? 'Clone Checklist' : 'Create Checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
