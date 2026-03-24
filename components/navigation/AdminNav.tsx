'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guides', label: 'Guides', icon: '👨‍🏫' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/users', label: 'Team', icon: '👥' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const currentPage = navItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Dashboard'

  return (
    <>
      {/* Top Header - Sticky */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center -ml-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </div>
          </div>
          
          <Link 
            href="/admin/settings"
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold"
          >
            {currentPage[0]}
          </Link>
        </div>
      </header>

      {/* Spacer for top header */}
      <div className="h-14" />

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
003e
                  T
                </div>
                <span className="font-bold text-gray-900">Tour Ops</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center"
              >
                ✕
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
              <button className="flex items-center gap-3 px-4 py-3 text-gray-600 w-full">
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
