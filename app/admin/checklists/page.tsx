'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ChecklistItem {
  id: string
  stage: string
  label: string
  is_mandatory: boolean
}

export default function ChecklistsPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [stats, setStats] = useState({ total: 0, mandatory: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChecklists()
  }, [])

  async function loadChecklists() {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('id, stage, label, is_mandatory')
      .order('stage')

    if (error) {
      console.error('Error loading checklists:', error)
    } else {
      setItems(data || [])
      setStats({
        total: data?.length || 0,
        mandatory: data?.filter((i: ChecklistItem) => i.is_mandatory).length || 0
      })
    }
    setLoading(false)
  }

  // Group by stage
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = []
    acc[item.stage].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const stageIcons: Record<string, string> = {
    pre_departure: '🚗',
    pre_pickup: '👋',
    dropoff: '🏨',
    finish: '✅'
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
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('checklists.title')}</h1>
              <p className="text-gray-500 text-sm">{t('checklists.subtitle')}</p>
            </div>
            <Link 
              href="/admin/checklists/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + {t('common.add')}
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">{t('checklists.totalItems')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.mandatory}</div>
            <div className="text-gray-500 text-xs">{t('checklists.mandatory')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="space-y-4">
            {Object.entries(grouped).map(([stage, stageItems]) => (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{stageIcons[stage] || '📝'}</span>
                  <span className="font-semibold">{t(`checklists.stages.${stage}`)}</span>
                  <span className="text-gray-400 text-sm">({stageItems.length})</span>
                </div>
                
                <div className="space-y-2">
                  {stageItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={false} readOnly className="w-5 h-5" />
                        <span className={item.is_mandatory ? 'font-medium' : 'text-gray-600'}>
                          {item.label}
                        </span>
                      </div>
                      {item.is_mandatory && (
                        <span className="text-xs text-red-500">{t('checklists.required')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
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
    </div>
  )
}