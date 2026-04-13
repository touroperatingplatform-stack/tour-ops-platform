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
  requires_checklist: boolean
  is_active: boolean
}

export default function SuperAdminActivitiesPage() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    requires_checklist: true
  })

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('name')
    
    if (data) setActivities(data)
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      requires_checklist: true
    })
    setShowModal(true)
  }

  function openEdit(activity: Activity) {
    setEditing(activity)
    setFormData({
      name: activity.name,
      description: activity.description || '',
      duration_minutes: activity.duration_minutes,
      requires_checklist: activity.requires_checklist
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }

    if (editing) {
      const { error } = await supabase
        .from('activities')
        .update({
          name: formData.name,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          requires_checklist: formData.requires_checklist
        })
        .eq('id', editing.id)

      if (error) {
        alert('Error updating activity')
        return
      }
    } else {
      const { error } = await supabase
        .from('activities')
        .insert({
          name: formData.name,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          requires_checklist: formData.requires_checklist,
          is_active: true
          // company_id is null by default = system activity
        })

      if (error) {
        alert('Error creating activity')
        return
      }
    }

    setShowModal(false)
    loadActivities()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this system activity?')) return

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting activity')
    } else {
      loadActivities()
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
              <h1 className="text-xl font-bold text-gray-900">System Activities</h1>
              <p className="text-gray-500 text-sm">Manage activities available to all companies</p>
            </div>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              + New Activity
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No system activities yet</p>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create first activity
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {activities.map(activity => (
              <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏃</span>
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                    </div>
                    {activity.description && (
                      <p className="text-gray-500 text-sm mt-1">{activity.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>⏱️ {activity.duration_minutes} min</span>
                      <span>{activity.requires_checklist ? '📋 Requires checklist' : 'No checklist needed'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEdit(activity)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
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
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Activity' : 'New System Activity'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cenote Swimming"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this activity involves"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_checklist}
                  onChange={(e) => setFormData(prev => ({ ...prev, requires_checklist: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requires equipment checklist</span>
              </label>
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
                {editing ? 'Save Changes' : 'Create Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
