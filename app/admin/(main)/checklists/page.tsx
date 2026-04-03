'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  created_at: string
}

export default function ChecklistsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as ChecklistItem[]
  })

  useEffect(() => {
    loadChecklists()
  }, [])

  async function loadChecklists() {
    const { data, error } = await supabase
      .from('checklists')
      .select('id, name, description, items, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading checklists:', error)
    } else {
      setChecklists(data || [])
    }
    setLoading(false)
  }

  function getStats(items: ChecklistItem[]) {
    return {
      total: items.length,
      mandatory: items.filter(i => i.required).length,
      photoRequired: items.filter(i => i.photo_required).length
    }
  }

  function openCreate() {
    setEditingId(null)
    setFormData({ name: '', description: '', items: [] })
    setShowModal(true)
  }

  function openClone(checklist: Checklist) {
    setEditingId(null)
    setFormData({
      name: `${checklist.name} (Copy)`,
      description: checklist.description || '',
      items: checklist.items.map(item => ({ ...item, id: crypto.randomUUID() }))
    })
    setShowModal(true)
  }

  function openEdit(checklist: Checklist) {
    setEditingId(checklist.id)
    setFormData({
      name: checklist.name,
      description: checklist.description || '',
      items: [...checklist.items]
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

    // Filter out empty items
    const validItems = formData.items.filter(item => item.text.trim())

    if (editingId) {
      // Update existing
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
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('checklists')
        .insert({
          name: formData.name,
          description: formData.description || null,
          items: validItems,
          is_active: true
        })

      if (error) {
        alert('Error creating checklist')
      }
    }

    setShowModal(false)
    loadChecklists()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this checklist?')) return

    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting checklist')
    } else {
      loadChecklists()
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
              <p className="text-gray-500 text-sm">{t('checklists.subtitle')}</p>
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

      {/* List */}
      <main className="flex-1 overflow-auto p-4">
        {checklists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No checklists yet</p>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create your first checklist
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.map(checklist => {
              const stats = getStats(checklist.items || [])
              return (
                <div
                  key={checklist.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                        {!checklist.is_active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {checklist.description && (
                        <p className="text-gray-500 text-sm mt-1">{checklist.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-500">
                          {stats.total} items
                        </span>
                        <span className="text-red-500">
                          {stats.mandatory} required
                        </span>
                        <span className="text-blue-500">
                          {stats.photoRequired} with photo
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openClone(checklist)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Clone"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => openEdit(checklist)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(checklist.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-gray-200">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/checklists" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">☑️</span>
            <span className="text-xs">{t('nav.checklists')}</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-xs">{t('profile.settings')}</span>
          </Link>
        </div>
      </nav>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editingId ? 'Edit Checklist' : 'New Checklist'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Pre-Departure Checklist"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief description of this checklist"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Items ({formData.items.length})
                  </label>
                  <button
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => updateItem(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Item description"
                        />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={e => updateItem(index, 'required', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={item.photo_required}
                              onChange={e => updateItem(index, 'photo_required', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            Photo required
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No items yet. Click "Add Item" to start.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {editingId ? 'Save Changes' : 'Create Checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
