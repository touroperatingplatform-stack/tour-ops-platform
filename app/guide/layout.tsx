'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import OfflineIndicator from './components/OfflineIndicator'

const navItems = [
  { href: '/guide', label: 'Tours', icon: '🚌' },
  { href: '/guide/activity', label: 'Team', icon: '💬' },
  { href: '/guide/history', label: 'History', icon: '📜' },
  { href: '/guide/incidents', label: 'Incidents', icon: '🚨' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

const bottomNavItems = [
  { href: '/guide', label: 'Tours', icon: '🚌' },
  { href: '/guide/activity', label: 'Team', icon: '💬' },
  { href: '/guide/incidents', label: 'Incidents', icon: '🚨' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [hasNotifications, setHasNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  const currentPage = navItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Tours'

  useEffect(() => {
    checkNotifications()
    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check for unread incidents assigned to this guide
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Nav - Fixed height */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-900 text-lg">{currentPage}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 relative">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:bg-blue-200"
            >
              T
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable, accounts for top + bottom nav */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Nav - Fixed height */}
      <nav className="bg-white border-t border-gray-200 flex-shrink-0 h-16">
        <div className="flex justify-around items-center h-full">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  T
                </div>
                <span className="font-bold text-gray-900">Tour Ops</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-gray-600 w-full rounded-xl hover:bg-gray-50">
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
      <OfflineIndicator />
    </div>
  )
}
