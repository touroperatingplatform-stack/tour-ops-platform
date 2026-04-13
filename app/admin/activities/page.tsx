'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  requires_checklist: boolean
  checklist_template_id: string | null
  is_active: boolean
  company_id: string
  checklist_templates?: { name: string }
}

interface ChecklistTemplate {
  id: string
  name: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    requires_checklist: true,
    default_checklist_template_id: ''
  })

  useEffect(() => {
    loadActivities()
    loadChecklists()
  }, [])

  async function loadActivities() {
    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      setLoading(false)
      return
    }
    
    const { data } = await supabase
      .from('activities')
      .select('*, checklist_templates(name)')
      .or(`company_id.eq.${profile.company_id},company_id.is.null`)
      .eq('is_active', true)
      .order('name')
    
    if (data) setActivities(data)
    setLoading(false)
  }

  async function loadChecklists() {
    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) return
    
    const { data } = await supabase
      .from('checklist_templates')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name')
    
    if (data) setChecklists(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      alert('No company assigned')
      return
    }
    
    const data = {
      name: formData.name,
      description: formData.description,
      duration_minutes: formData.duration_minutes,
      requires_checklist: formData.requires_checklist,
      checklist_template_id: formData.default_checklist_template_id || null,
      company_id: profile.company_id
    }
    
    if (editing) {
      // Don't update company_id when editing
      const { company_id, ...updateData } = data
      await supabase
        .from('activities')
        .update(updateData)
        .eq('id', editing.id)
    } else {
      await supabase
        .from('activities')
        .insert([data])
    }
    
    setShowModal(false)
    setEditing(null)
    setFormData({ name: '', description: '', duration_minutes: 60, requires_checklist: true, default_checklist_template_id: '' })
    loadActivities()
  }

  function editActivity(activity: Activity) {
    setEditing(activity)
    setFormData({
      name: activity.name,
      description: activity.description || '',
      duration_minutes: activity.duration_minutes,
      requires_checklist: activity.requires_checklist,
      default_checklist_template_id: activity.checklist_template_id || ''
    })
    setShowModal(true)
  }

  async function deleteActivity(id: string) {
    if (!confirm('Delete this activity?')) return
    
    await supabase
      .from('activities')
      .update({ is_active: false })
      .eq('id', id)
    
    loadActivities()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-500">Manage tour activities and link checklists</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({ name: '', description: '', duration_minutes: 60, requires_checklist: true, default_checklist_template_id: '' })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + New Activity
        </button>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No activities yet</p>
            <p className="text-sm">Create activities to assign to tours</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{activity.name}</h3>
                  <p className="text-sm text-gray-500">
                    {activity.duration_minutes} min • 
                    {activity.requires_checklist ? 'Requires checklist' : 'No checklist'}
                    {activity.checklist_templates?.name && ` • Linked: ${activity.checklist_templates.name}`}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-400">{activity.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editActivity(activity)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editing ? 'Edit Activity' : 'New Activity'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checklist Template
                </label>
                <select
                  value={formData.default_checklist_template_id}
                  onChange={(e) => setFormData({ ...formData, default_checklist_template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {checklists.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_checklist"
                  checked={formData.requires_checklist}
                  onChange={(e) => setFormData({ ...formData, requires_checklist: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="requires_checklist" className="text-sm text-gray-700">
                  Requires checklist
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editing ? 'Save Changes' : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
