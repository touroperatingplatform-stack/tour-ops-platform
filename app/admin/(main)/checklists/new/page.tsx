'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function NewChecklistPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [stage, setStage] = useState('pre_departure')
  const [label, setLabel] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const stages = [
    { value: 'pre_departure', label: t('checklists.stages.pre_departure'), icon: '🚗' },
    { value: 'pre_pickup', label: t('checklists.stages.pre_pickup'), icon: '👋' },
    { value: 'dropoff', label: t('checklists.stages.dropoff'), icon: '🏨' },
    { value: 'finish', label: t('checklists.stages.finish'), icon: '✅' },
  ]

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
      setMessage(t('checklists.saveError'))
      setSaving(false)
    } else {
      router.push('/admin/checklists')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg font-bold">{t('checklists.addItem')}</h1>
              <p className="text-gray-500 text-sm">{t('checklists.createCheckpoint')}</p>
            </div>
            {message && (
              <span className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          
          {/* Stage Selection */}
          <div className="mb-4">
            <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{t('checklists.stage')}</label>
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
            <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{t('checklists.taskDescription')}</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('checklists.taskPlaceholder')}
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
                <div className="font-medium">{t('checklists.mandatoryItem')}</div>
                <div className="text-gray-500 text-sm">{t('checklists.mandatoryDesc')}</div>
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
              {saving ? t('common.save') + '...' : t('checklists.addItem')}
            </button>
            
            <Link
              href="/admin/checklists"
              className="w-full block text-center py-3 text-gray-600 font-medium"
            >
              {t('common.cancel')}
            </Link>
          </div>

        </form>
      </main>
    </div>
  )
}