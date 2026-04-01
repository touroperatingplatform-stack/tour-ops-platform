'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function DataPage() {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function exportData() {
    setLoading(true)
    setMessage('')

    try {
      const [
        { data: tours },
        { data: incidents },
        { data: expenses },
        { data: vehicles },
        { data: checkins }
      ] = await Promise.all([
        supabase.from('tours').select('*'),
        supabase.from('incidents').select('*'),
        supabase.from('tour_expenses').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('guide_checkins').select('*')
      ])

      const exportObj = {
        exported_at: new Date().toISOString(),
        tours: tours || [],
        incidents: incidents || [],
        expenses: expenses || [],
        vehicles: vehicles || [],
        guide_checkins: checkins || []
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setMessage(t('data.exportComplete'))
    } catch (error) {
      setMessage(t('data.exportFailed'))
    }

    setLoading(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">{t('data.title')}</h1>
            <p className="text-gray-500 text-sm">{t('data.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="px-4 py-2 flex-shrink-0 border-8 border-transparent">
          <div className="bg-blue-50 text-blue-700 rounded-lg p-3 text-sm">
            {message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={exportData}
              disabled={loading}
              className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                📤
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold">{t('data.exportData')}</div>
                <div className="text-gray-500 text-sm">{t('data.exportDesc')}</div>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            {/* Import */}
            <Link
              href="/super-admin/import"
              className="block bg-white rounded-xl shadow p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📥
              </div>
              <div className="flex-1">
                <div className="font-bold">{t('data.importData')}</div>
                <div className="text-gray-500 text-sm">{t('data.importDesc')}</div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            {/* Divider */}
            <div className="py-2">
              <div className="border-t" />
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <span className="font-bold text-red-700">{t('data.dangerZone')}</span>
              </div>
              <p className="text-red-600 text-sm mb-3">
                {t('data.dangerDesc')}
              </p>
              <Link
                href="/super-admin/demo"
                className="block w-full bg-red-600 text-white text-center py-2 rounded-lg font-medium"
              >
                {t('data.clearDemo')}
              </Link>
            </div>
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
          <Link href="/admin/data" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">💾</span>
            <span className="text-xs">{t('data.title')}</span>
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