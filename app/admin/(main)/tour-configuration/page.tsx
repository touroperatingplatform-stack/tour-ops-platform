'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

const STAGES = [
  { id: 'acknowledgement', labelKey: 'acknowledgement', icon: '👋' },
  { id: 'pre_departure', labelKey: 'preDeparture', icon: '🚐' },
  { id: 'pre_pickup', labelKey: 'prePickup', icon: '📍' },
  { id: 'activity', labelKey: 'activity', icon: '🎯' },
  { id: 'dropoff', labelKey: 'dropoff', icon: '🏁' },
  { id: 'finish', labelKey: 'finish', icon: '✅' }
]

export default function CompanyTourConfigurationPage() {
  const { t } = useTranslation()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (profile?.company_id) {
      setCompanyId(profile.company_id)
      
      // Load activities (system + company)
      const [{ data: sysAct }, { data: coAct }] = await Promise.all([
        supabase.from('activities').select('*').is('company_id', null).eq('is_active', true),
        supabase.from('activities').select('*').eq('company_id', profile.company_id).eq('is_active', true)
      ])

      // Load checklists (system + company)
      const [{ data: sysChk }, { data: coChk }] = await Promise.all([
        supabase.from('checklists').select('*').is('company_id', null).eq('is_active', true),
        supabase.from('checklists').select('*').eq('company_id', profile.company_id).eq('is_active', true)
      ])

      setActivities([
        ...(sysAct || []).map(a => ({ ...a, is_system: true })),
        ...(coAct || []).map(a => ({ ...a, is_system: false }))
      ].sort((a, b) => a.name.localeCompare(b.name)))

      setChecklists([
        ...(sysChk || []).map(c => ({ ...c, is_system: true })),
        ...(coChk || []).map(c => ({ ...c, is_system: false }))
      ])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('tourConfiguration.title')}</h1>
          <p className="text-sm text-gray-500">{t('tourConfiguration.subtitle')}</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto">
          {/* Activities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('tourConfiguration.activities')} ({activities.length})</h2>
              <span className="text-xs text-gray-500">{t('tourConfiguration.activitiesSubtitle')}</span>
            </div>
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏃</span>
                    <div>
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.duration_minutes} min</p>
                    </div>
                  </div>
                  {activity.is_system ? (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">{t('tourConfiguration.system')}</span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{t('tourConfiguration.custom')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Checklists */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('tourConfiguration.checklists')} ({checklists.length})</h2>
              <span className="text-xs text-gray-500">{t('tourConfiguration.checklistsSubtitle')}</span>
            </div>
            <div className="space-y-2">
              {STAGES.map(stage => {
                const stageChecklists = checklists.filter(c => c.stage === stage.id)
                return (
                  <div key={stage.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{stage.icon}</span>
                      <span className="font-medium text-sm">{t(`tourConfiguration.${stage.labelKey}`)}</span>
                      <span className="text-xs text-gray-500">({stageChecklists.length})</span>
                    </div>
                    <div className="space-y-1">
                      {stageChecklists.map(checklist => (
                        <div key={checklist.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">📋 {checklist.name}</span>
                          {checklist.is_system ? (
                            <span className="text-xs text-gray-400">{t('tourConfiguration.system')}</span>
                          ) : (
                            <span className="text-xs text-blue-600">{t('tourConfiguration.custom')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
