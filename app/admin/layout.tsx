'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'

const bottomNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
]

const allMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/checklists', label: 'Checklists', icon: '☑️' },
  { href: '/admin/guides/availability', label: 'Guides', icon: '🎯' },
  { href: '/admin/templates', label: 'Templates', icon: '📋' },
  { href: '/admin/data', label: 'Data', icon: '💾' },
  { href: '/admin/import', label: 'Import', icon: '📥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const currentPage = allMenuItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Dashboard'

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Top Navigation - Dashboard Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Title + Date */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                T
              </div>
              <div>
                <h1 className="text-lg font-bold">{currentPage}</h1>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* User Dropdown */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="fixed right-4 top-16 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <Link 
              href="/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <span>👤</span>
              <span className="text-sm">Profile</span>
            </Link>
            <Link 
              href="/admin/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <span>⚙️</span>
              <span className="text-sm">Settings</span>
            </Link>
            <div className="border-t border-gray-200 my-1"></div>
            <button 
              onClick={() => { handleSignOut(); setShowUserMenu(false); }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 text-left"
            >
              <span>🚪</span>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </>
      )}

      {/* Full Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMenu(false)}
          />
          <aside className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">Menu</span>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {allMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                      isActive(item.href) 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation - Dashboard Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-4 py-3">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center ${active ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center text-gray-400"
          >
            <span className="text-xl">☰</span>
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
