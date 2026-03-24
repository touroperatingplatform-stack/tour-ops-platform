'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/guide', label: 'Tours', icon: '🚌', activeIcon: '🚌' },
  { href: '/guide/activity', label: 'Team', icon: '💬', activeIcon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤', activeIcon: '👤' },
]

export default function GuideNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Top Header - Sticky */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="font-bold text-gray-900">Tour Ops</span>
          </div>
          
          {/* Optional: Quick action or notification bell */}
          <button className="w-10 h-10 flex items-center justify-center text-gray-600">
            🔔
          </button>
        </div>
      </header>

      {/* Spacer for top header */}
      <div className="h-14" />

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl mb-0.5">{isActive ? item.activeIcon : item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16" />
    </>
  )
}
