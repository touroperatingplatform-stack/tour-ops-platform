'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

const stages = [
  { value: 'pre_departure', label: 'Pre-Departure', icon: '🚗' },
  { value: 'pre_pickup', label: 'Pre-Pickup', icon: '👋' },
  { value: 'dropoff', label: 'Dropoff', icon: '🏨' },
  { value: 'finish', label: 'Finish', icon: '✅' },
]

export default function NewChecklistPage() {
  const router = useRouter()
  const [stage, setStage] = useState('pre_departure')
  const [label, setLabel] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return

    setSaving(true)
    setMessage('')

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .single()

    const { error } = await supabase
      .from('checklist_templates')
      .insert({
        company_id: profile?.company_id,
        stage,
        label: label.trim(),
        is_mandatory: isMandatory
      })

    if (error) {
      setMessage('❌ Error saving checklist item')
      setSaving(false)
    } else {
      router.push('/admin/checklists')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Add Checklist Item</h1>
            <p className="text-gray-500 text-sm">Create tour checkpoint</p>
          </div>
          {message && (
            <span className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 overflow-y-auto">
        
        {/* Stage Selection */}
        <div className="mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">Stage</label>
          <div className="grid grid-cols-2 gap-2">
            {stages.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStage(s.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  stage === s.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mr-2">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Label Input */}
        <div className="mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">Task Description</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Check vehicle fuel level"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Mandatory Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 p-4 bg-white rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-5 h-5"
            />
            <div>
              <div className="font-medium">Mandatory Item</div>
              <div className="text-gray-500 text-sm">Must be completed before tour can finish</div>
            </div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Checklist Item'}
          </button>
          
          <Link
            href="/admin/checklists"
            className="w-full block text-center py-3 text-gray-600 font-medium"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}
