'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

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

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const currentPage = navItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Tours'

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Gray frame padding - 12px breathing room */}
      <div className="flex-1 p-4 pb-20 overflow-hidden">
        {/* White bordered container */}
        <div className="mx-auto w-full h-full bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Top Navigation */}
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
                <span className="font-semibold text-gray-900">{currentPage}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 relative">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Avatar + Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:bg-blue-200"
                  >
                    T
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <Link 
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                        >
                          <span>👤</span>
                          <span className="text-sm">Profile</span>
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button 
                          onClick={() => { handleSignOut(); setIsUserMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 text-left"
                        >
                          <span>🚪</span>
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content - padding inside scroll area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-3">{children}</div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16">
        <div className="flex justify-around items-center h-full max-w-full mx-auto px-4">
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
          )}
        </div>
      </nav>

      {/* Mobile Side Menu */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  T
                </div>
                <span className="font-bold text-gray-900">Tour Ops</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
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
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <button 
                onClick={() => { handleSignOut(); setIsMenuMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-gray-600 w-full rounded-xl hover:bg-gray-50"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
