'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/guide', label: 'Tours', icon: '🚌' },
  { href: '/guide/activity', label: 'Team', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop: Full width. Mobile: Centered phone width */}
      <div className="mx-auto w-full max-w-full lg:px-4 lg:py-4">
        <div className="mx-auto w-full max-w-md lg:max-w-none bg-white lg:border lg:border-gray-300 lg:rounded-2xl lg:shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-2rem)]">
          
          {/* Top Navigation */}
          <header className="bg-white border-b border-gray-200">
            <div className="px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  T
                </div>
                <span className="font-semibold text-gray-900">Tour Ops</span>
              </div>
              <div className="flex items-center gap-3">
                <nav className="hidden lg:flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4">
            {children}
          </main>

          {/* Bottom Navigation - always visible */}
          <nav className="bg-white border-t border-gray-200">
            <div className="flex justify-around items-center h-16">
              {navItems.map((item) => {
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
        </div>
      </div>
    </div>
  )
}
