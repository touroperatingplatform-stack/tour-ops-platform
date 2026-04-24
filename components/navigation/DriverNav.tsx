'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function DriverNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveTour()
  }, [])

  async function loadActiveTour() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('tours')
        .select('id, status')
        .eq('driver_id', user.id)
        .eq('tour_date', today)
        .neq('status', 'cancelled')
        .order('status', { ascending: false }) // in_progress before scheduled
        .limit(1)
        .maybeSingle()
      
      if (data && data.status === 'in_progress') {
        setActiveTourId(data.id)
      }
    } catch (error) {
      console.error('Error loading active tour:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/driver') return pathname === '/driver'
    return pathname.startsWith(href)
  }

  // Check-in link changes based on active tour
  const checkinHref = activeTourId ? `/driver/tours/${activeTourId}` : '/driver/checkin'
  const checkinLabel = activeTourId ? t('driver.tour') : t('driver.checkin')

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-4 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-gray-900">Tour Ops</span>
            </div>
            
            <button className="w-10 h-10 flex items-center justify-center text-gray-600">
              🔔
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-4 border-transparent">
        <div className="h-full overflow-auto border-4 border-transparent">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {/* Tours */}
          <Link
            href="/driver"
            className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
              isActive('/driver') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('driver.tours')}</span>
          </Link>
          
          {/* Check-in - Dynamic based on active tour */}
          <Link
            href={checkinHref}
            className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
              isActive(checkinHref) ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">🚗</span>
            <span className="text-xs">{checkinLabel}</span>
          </Link>
          
          {/* Profile */}
          <Link
            href="/driver/profile"
            className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
              isActive('/driver/profile') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">👤</span>
            <span className="text-xs">{t('driver.profile')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}