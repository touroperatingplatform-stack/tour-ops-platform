'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
]

const moreItems = [
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const currentPage = 'Test Page'

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation - DEBUG: Invisible outer, red inner */}
      <header className="bg-white border-8 border-transparent flex-shrink-0">
        <div className="border-b-4 border-red-400 px-4 py-3">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo/Brand - DEBUG: Blue background */}
            <div className="flex items-center gap-3 border-4 border-blue-400 border-dashed p-2 mx-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </div>

            {/* Right side - DEBUG: Purple background */}
            <div className="flex items-center gap-2 border-4 border-purple-400 border-dashed p-2 mx-2">
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-green-200">
        <div className="w-full h-full overflow-auto px-10 py-6 border-8 border-transparent">
          <div className="h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - DEBUG: Orange border */}
      <nav className="flex-none bg-white border-t-4 border-orange-400 z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] border-2 border-dashed border-yellow-400 ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500 border-2 border-dashed border-teal-400"
          >
            <span className="text-xl mb-1">☰</span>
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl z-50 border-8 border-pink-400">
            <div className="p-4 border-8 border-transparent">
              <div className="flex items-center justify-center mb-4 border-2 border-dashed border-cyan-400 p-2">
                <span className="font-bold text-lg">Menu</span>
                <button 
                  onClick={() => setShowMore(false)}
                  className="absolute right-6 p-2 hover:bg-gray-100 rounded-lg border-2 border-dashed border-red-400"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 border-2 border-dashed border-indigo-400 p-2">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl text-gray-600 hover:bg-gray-50 border border-dashed border-gray-300"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
