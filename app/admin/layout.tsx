'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LanguageToggle from '@/components/LanguageToggle'

const topNavItems = [
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
]

const bottomNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
  { href: '/admin/settings', label: 'More', icon: '☰' },
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
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
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
      {/* Top Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </Link>

            {/* Top Nav */}
            <div className="flex items-center gap-1">
              {topNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:bg-blue-200"
              >
                T
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16">
        <div className="flex items-center h-full">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href)
            const isMore = item.label === 'More'
            return (
              <Link
                key={item.href}
                href={isMore ? '#' : item.href}
                onClick={isMore ? () => setShowMenu(true) : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                {active && !isMore && (
                  <div className="absolute bottom-1 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
