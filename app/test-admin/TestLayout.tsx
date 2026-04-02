'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'

const navItems = [
  { href: '/admin', labelKey: 'nav.dashboard', icon: '📊' },
  { href: '/admin/tours', labelKey: 'nav.tours', icon: '🚌' },
  { href: '/admin/guests', labelKey: 'nav.guests', icon: '👤' },
  { href: '/admin/reports', labelKey: 'nav.reports', icon: '📈' },
  { href: '/admin/vehicles', labelKey: 'nav.vehicles', icon: '🚐' },
  { href: '/admin/expenses', labelKey: 'nav.expenses', icon: '💵' },
]

const moreItems = [
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const userMenuItems = [
  { labelKey: 'profile.title', icon: '👤', action: () => console.log('Profile') },
  { labelKey: 'profile.settings', icon: '⚙️', action: () => console.log('Settings') },
  { labelKey: 'auth.signOut', icon: '🚪', action: () => console.log('Logout') },
]

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState(3)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
            {/* Logo + Dashboard */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-gray-900">{t('nav.dashboard')}</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* Notifications */}
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 relative">
                🔔
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              
              {/* User Button */}
              <button 
                onClick={() => setShowUserMenu(true)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto px-6 py-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-4 py-3">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{t(item.labelKey)}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500"
          >
            <span className="text-xl mb-1">☰</span>
            <span className="text-xs">{t('nav.menu')}</span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-white z-50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-center mb-4 p-4">
                <span className="font-bold text-2xl">{t('nav.menu')}</span>
                <button 
                  onClick={() => setShowMore(false)}
                  className="absolute right-10 p-4 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4 p-2">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-gray-600 hover:bg-gray-50 bg-gray-50 h-full"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Menu */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-50"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="fixed top-20 right-8 w-64 bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-2">
              <div className="border-b pb-3 mb-3">
                <div className="flex flex-col items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    👤
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Admin User</p>
                    <p className="text-xs text-gray-500">admin@example.com</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {userMenuItems.map((item) => (
                  <button
                    key={item.labelKey}
                    onClick={() => {
                      item.action()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm">{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
