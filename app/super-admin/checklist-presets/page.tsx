'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ChecklistItem {
  id: string
  text: string
  required: boolean
  photo_required: boolean
}

interface ChecklistPreset {
  id: string
  name: string
  description: string | null
  items: ChecklistItem[]
  stage: string
  is_active: boolean
  created_at: string
}

const STAGES = [
  { id: 'acknowledgement', label: 'Acknowledgement', icon: '👋', desc: 'Pre-tour guide confirmation' },
  { id: 'pre_departure', label: 'Pre-Departure', icon: '🚐', desc: 'Before leaving office' },
  { id: 'pre_pickup', label: 'Pre-Pickup', icon: '📍', desc: 'Before picking up guests' },
  { id: 'activity', label: 'Activity', icon: '🎯', desc: 'During tour activities' },
  { id: 'dropoff', label: 'Dropoff', icon: '🏁', desc: 'Guest dropoff phase' },
  { id: 'finish', label: 'Finish', icon: '✅', desc: 'Tour completion' }
]

export default function SuperAdminChecklistPresetsPage() {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<ChecklistPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('acknowledgement')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stage: 'acknowledgement',
    items: [] as ChecklistItem[]
  })

  useEffect(() => {
    loadPresets()
  }, [])

  async function loadPresets() {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .is('company_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading presets:', error)
    } else {
      setPresets(data || [])
    }
    setLoading(false)
  }

  const stagePresets = presets.filter(p => p.stage === activeStage && p.is_active)

  function openCreate() {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      stage: activeStage,
      items: []
    })
    setShowModal(true)
  }

  function openEdit(preset: ChecklistPreset) {
    setEditingId(preset.id)
    setFormData({
      name: preset.name,
      description: preset.description || '',
      stage: preset.stage || 'acknowledgement',
      items: preset.items || []
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

    if (editingId) {
      const { error } = await supabase
        .from('checklists')
        .update({
          name: formData.name,
          description: formData.description || null,
          stage: formData.stage,
          items: validItems
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error updating preset:', error)
        alert('Error updating preset')
        return
      }
    } else {
      const { error } = await supabase
        .from('checklists')
        .insert({
          name: formData.name,
          description: formData.description || null,
          stage: formData.stage,
          items: validItems,
          is_active: true
        })

      if (error) {
        console.error('Error creating preset:', error)
        alert('Error creating preset')
        return
      }
    }

    setShowModal(false)
    loadPresets()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this system preset? Companies won't be able to copy it anymore.")) return

    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting preset:', error)
      alert('Error deleting preset')
    } else {
      loadPresets()
    }
  }

  async function handleDuplicate(preset: ChecklistPreset) {
    const { error } = await supabase
      .from('checklists')
      .insert({
        name: `${preset.name} (Copy)`,
        description: preset.description,
        stage: preset.stage,
        items: preset.items,
        is_active: true
      })

    if (error) {
      console.error('Error duplicating preset:', error)
      alert('Error duplicating preset')
    } else {
      loadPresets()
    }
  }

  const currentStageInfo = STAGES.find(s => s.id === activeStage)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading presets...</div>
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
              <h1 className="text-xl font-bold text-gray-900">System Checklist Presets</h1>
              <p className="text-gray-500 text-sm">Create default checklists organized by tour phase</p>
            </div>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              + New Preset
            </button>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="flex overflow-x-auto border-t border-gray-200">
          {STAGES.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeStage === stage.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{stage.icon}</span>
              {stage.label}
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {presets.filter(p => p.stage === stage.id && p.is_active).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Stage Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>{currentStageInfo?.icon}</span>
            {currentStageInfo?.label} Checklists
          </h2>
          <p className="text-gray-500 text-sm mt-1">{currentStageInfo?.desc}</p>
        </div>

        {stagePresets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-900 font-medium mb-2">No {currentStageInfo?.label.toLowerCase()} checklists yet</p>
            <p className="text-gray-500 text-sm mb-4">
              Create presets that companies can copy and customize
            </p>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create first preset
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stagePresets.map(preset => (
              <div
                key={preset.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{preset.name}</h3>
                    {preset.description && (
                      <p className="text-gray-500 text-sm mt-1">{preset.description}</p>
                    )}
                    
                    <div className="mt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>{preset.items?.length || 0} items total</span>
                        <span>•</span>
                        <span className="text-red-600">
                          {preset.items?.filter(i => i.required).length || 0} required
                        </span>
                        <span>•</span>
                        <span className="text-amber-600">
                          {preset.items?.filter(i => i.photo_required).length || 0} photo required
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {preset.items?.slice(0, 6).map((item, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-3 py-1.5 rounded-full border ${
                              item.required 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                            {item.text}
                            {item.photo_required && ' 📷'}
                          </span>
                        ))}
                        {(preset.items?.length || 0) > 6 && (
                          <span className="text-xs text-gray-500 px-2 py-1.5">
                            +{preset.items!.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEdit(preset)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(preset)}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Preset' : 'New System Preset'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Create a checklist that companies can copy for {currentStageInfo?.label.toLowerCase()}
              </p>
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-5">
              {/* Stage Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Phase
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.icon} {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Guide Readiness Checklist"
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
                  placeholder="Describe when this checklist should be used"
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
                    className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 font-mono text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem(index, 'text', e.target.value)}
                          placeholder="e.g., Guide license verified"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-6 ml-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) => updateItem(index, 'required', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.photo_required}
                            onChange={(e) => updateItem(index, 'photo_required', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">Photo proof required 📷</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm mb-2">No items yet</p>
                      <button
                        onClick={addItem}
                        className="text-blue-600 text-sm font-medium"
                      >
                        + Add your first item
                      </button>
                    </div>
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
                {editingId ? 'Save Changes' : 'Create Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
