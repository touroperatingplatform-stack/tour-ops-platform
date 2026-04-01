'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function GuideAvailabilityPage() {
  const { t } = useTranslation()
  const [guides, setGuides] = useState<Guide[]>([])
  const [availableToday, setAvailableToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    const today = getLocalDate()
    
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'guide')
      .eq('status', 'active')
      .order('first_name')

    if (data) {
      setGuides(data)
      // Would check availability from schedule table
      setAvailableToday(data.length) // Simplified
    }
    setLoading(false)
  }

  const days = [t('time.mon'), t('time.tue'), t('time.wed'), t('time.thu'), t('time.fri'), t('time.sat'), t('time.sun')]

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
              <h1 className="text-xl font-bold">{t('roles.guide')}</h1>
              <p className="text-gray-500 text-sm">{t('guides.teamAvailability')}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{availableToday}/{guides.length}</div>
              <div className="text-gray-500 text-xs">{t('guides.available')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Selector */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day, i) => (
            <button
              key={day}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm ${
                i === 0 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="space-y-2">
            {guides.map(guide => (
              <div
                key={guide.id}
                className="bg-white rounded-xl shadow p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                    🎯
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold">{guide.first_name} {guide.last_name}</h3>
                    <p className="text-gray-500 text-sm">{guide.email}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      {t('guides.available')}
                    </span>
                  </div>
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
          <Link href="/admin/guides/availability" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">🎯</span>
            <span className="text-xs">{t('roles.guide')}</span>
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