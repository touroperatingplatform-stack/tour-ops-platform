'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChecklistTemplate } from '@/lib/supabase/types'

const stages = [
  { value: 'pre_departure', label: 'Pre-Departure' },
  { value: 'pre_pickup', label: 'Pre-Pickup' },
  { value: 'dropoff', label: 'Dropoff' },
  { value: 'finish', label: 'Finish' },
]

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    stage: 'pre_departure',
    label: '',
    description: '',
    requires_photo: false,
    requires_text_input: false,
    requires_gps: false,
    requires_selfie: false,
    is_mandatory: true,
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data, error } = await (supabase as any)
      .from('checklist_templates')
      .select('*')
      .order('stage')
      .order('sort_order')

    if (error) {
      console.error('Error loading templates:', error)
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await (supabase as any)
      .from('checklist_templates')
      .insert({
        brand_id: 'b0000000-0000-0000-0000-000000000001',
        stage: formData.stage,
        label: formData.label,
        description: formData.description || null,
        requires_photo: formData.requires_photo,
        requires_text_input: formData.requires_text_input,
        requires_gps: formData.requires_gps,
        requires_selfie: formData.requires_selfie,
        is_mandatory: formData.is_mandatory,
        is_active: true,
        sort_order: templates.length + 1,
      })

    if (!error) {
      setFormData({
        stage: 'pre_departure',
        label: '',
        description: '',
        requires_photo: false,
        requires_text_input: false,
        requires_gps: false,
        requires_selfie: false,
        is_mandatory: true,
      })
      setShowForm(false)
      loadTemplates()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading checklists...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist Templates</h1>
          <p className="text-gray-500 mt-1">Manage pre-tour checklists</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add Item</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Checklist Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {stages.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Check vehicle condition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed instructions..."
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_photo}
                  onChange={(e) => setFormData({ ...formData, requires_photo: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Requires Photo</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_gps}
                  onChange={(e) => setFormData({ ...formData, requires_gps: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Requires GPS</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_selfie}
                  onChange={(e) => setFormData({ ...formData, requires_selfie: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Requires Selfie</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Mandatory</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No checklist items yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Stage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Label</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {t.stage?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{t.label}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {t.requires_photo && <span className="text-xs">📷 Photo</span>}
                        {t.requires_gps && <span className="text-xs">📍 GPS</span>}
                        {t.requires_selfie && <span className="text-xs">🤳 Selfie</span>}
                        {t.is_mandatory && <span className="text-xs">⚡ Required</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">{templates.length} checklist items</div>
    </div>
  )
}
