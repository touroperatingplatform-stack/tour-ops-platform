'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const navItems = [
  { href: '/supervisor', label: 'Live', icon: '📡' },
  { href: '/supervisor/incidents', label: 'Incidents', icon: '🚨' },
  { href: '/supervisor/tours', label: 'Tours', icon: '🚌' },
  { href: '/supervisor/guides', label: 'Guides', icon: '👥' },
]

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Gray frame with 12px breathing room from screen edges */}
      <div className="flex-1 p-3 pb-[5.5rem] overflow-hidden">
        {/* White container - 12px from screen edges, content touches edges */}
        <div className="mx-auto w-full h-full bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Top Navigation */}
          <header className="bg-gray-900 text-white shadow-sm flex-shrink-0 z-10">
            <div className="px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📡</span>
                <span className="font-semibold">Supervisor</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 relative">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Avatar + Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-gray-600"
                  >
                    T
                  </button>

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
                        <Link 
                          href="/supervisor/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                        >
                          <span>⚙️</span>
                          <span className="text-sm">Settings</span>
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

          {/* Page Content - padding inside scroll area to avoid overflow-hidden clipping */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-3">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16">
        <div className="flex justify-around items-center h-full max-w-full mx-auto px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
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
    </div>
  )
}
