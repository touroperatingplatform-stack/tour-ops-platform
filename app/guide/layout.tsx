'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import OfflineIndicator from './components/OfflineIndicator'
import GuideTopNav from './components/GuideTopNav'
import { useTranslation } from '@/lib/i18n/useTranslation'

const navItems = [
  { href: '/guide', labelKey: 'nav.tours', icon: '🚌' },
  { href: '/guide/activity', labelKey: 'nav.team', icon: '💬' },
  { href: '/guide/history', labelKey: 'driver.history', icon: '📜' },
  { href: '/guide/incidents', labelKey: 'nav.incidents', icon: '🚨' },
  { href: '/profile', labelKey: 'profile.title', icon: '👤' },
]

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [hasNotifications, setHasNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    checkNotifications()
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('reported_by', user.id)
      .eq('status', 'open')

    if (count && count > 0) {
      setHasNotifications(true)
      setNotificationCount(count)
    } else {
      setHasNotifications(false)
      setNotificationCount(0)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Top Navigation */}
      <GuideTopNav />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-hidden bg-white border-4 border-transparent">
        <div className="h-full overflow-auto border-4 border-transparent">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-4 min-w-[64px] ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  )
}
