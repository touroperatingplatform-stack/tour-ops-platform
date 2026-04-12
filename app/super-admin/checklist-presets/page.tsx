'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ChecklistItem {
  id: string
  text: string
  quantity: number
  perPerson: boolean
  photoRequired: boolean
}

interface ChecklistTemplate {
  id: string
  name: string
  category: string
  description: string | null
  items: ChecklistItem[]
  is_active: boolean
  created_at: string
}

export default function SuperAdminChecklistPresetsPage() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    category: 'activity',
    description: '',
    items: [] as ChecklistItem[]
  })

  const categories = [
    { value: 'activity', label: 'Activity Equipment', icon: '🏊' },
    { value: 'van', label: 'Van Equipment', icon: '🚐' },
    { value: 'general', label: 'General', icon: '📋' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('is_system', true)
      .order('category')
      .order('name')

    if (error) {
      console.error('Error loading templates:', error)
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setFormData({
      name: '',
      category: 'activity',
      description: '',
      items: []
    })
    setShowModal(true)
  }

  function openEdit(template: ChecklistTemplate) {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      category: template.category || 'activity',
      description: template.description || '',
      items: template.items || []
    })
    setShowModal(true)
  }

  function addItem() {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: crypto.randomUUID(),
        text: '',
        quantity: 1,
        perPerson: true,
        photoRequired: false
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
        .from('checklist_templates')
        .update({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          items: validItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error updating template:', error)
        alert('Error updating template')
        return
      }
    } else {
      const { error } = await supabase
        .from('checklist_templates')
        .insert({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          items: validItems,
          is_system: true,
          is_active: true,
          company_id: null
        })

      if (error) {
        console.error('Error creating template:', error)
        alert('Error creating template')
        return
      }
    }

    setShowModal(false)
    loadTemplates()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this system preset? This will affect all companies using it.')) return

    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template')
    } else {
      loadTemplates()
    }
  }

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter(t => t.category === filterCategory)

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const cat = template.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(template)
    return acc
  }, {} as Record<string, ChecklistTemplate[]>)

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
              <h1 className="text-xl font-bold text-gray-900">System Checklist Presets</h1>
              <p className="text-gray-500 text-sm">Create default equipment checklists that companies can copy</p>
            </div>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              + New Preset
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {filteredTemplates.length} presets
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No system presets yet</p>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create first preset
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, items]) => {
              const catInfo = categories.find(c => c.value === category) || { label: 'General', icon: '📋' }
              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>{catInfo.icon}</span>
                    {catInfo.label}
                    <span className="text-sm font-normal text-gray-500">({items.length})</span>
                  </h2>
                  <div className="grid gap-3">
                    {items.map(template => (
                      <div
                        key={template.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{template.name}</h3>
                              {!template.is_active && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-gray-500 text-sm mt-1">{template.description}</p>
                            )}
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 mb-2">
                                {template.items?.length || 0} items:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {template.items?.slice(0, 5).map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                                  >
                                    {item.text}
                                    {item.quantity > 1 && ` (x${item.quantity})`}
                                    {item.perPerson && '/person'}
                                    {item.photoRequired && '📷'}
                                  </span>
                                ))}
                                {(template.items?.length || 0) > 5 && (
                                  <span className="text-xs text-gray-500">
                                    +{template.items.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => openEdit(template)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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
                Create equipment checklists that companies can copy
              </p>
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cenote Swimming Equipment"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formData.category === cat.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl mr-2">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this preset should be used"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Equipment Items
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
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem(index, 'text', e.target.value)}
                          placeholder="e.g., Snorkel masks"
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
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Quantity:</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            min={1}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.perPerson}
                            onChange={(e) => updateItem(index, 'perPerson', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Per person</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.photoRequired}
                            onChange={(e) => updateItem(index, 'photoRequired', e.target.checked)}
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
                {editingId ? 'Save Changes' : 'Create Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
