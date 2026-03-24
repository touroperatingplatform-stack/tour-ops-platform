'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const navItems = [
  { href: '/operations', label: 'Today', icon: '📅' },
  { href: '/operations/fleet', label: 'Fleet', icon: '🚐' },
  { href: '/operations/maintenance', label: 'Maintenance', icon: '🔧' },
  { href: '/operations/reports', label: 'Reports', icon: '📊' },
]

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop: Full width. Mobile: Centered phone width */}
      <div className="mx-auto w-full max-w-full lg:px-4 lg:py-4">
        <div className="mx-auto w-full max-w-md lg:max-w-none bg-white lg:border lg:border-gray-300 lg:rounded-2xl lg:shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-2rem)]">
          
          {/* Top Navigation */}
          <header className="bg-gray-900 text-white border-b border-gray-800">
            <div className="px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <span className="font-semibold">Operations</span>
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
                          isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <button 
                  onClick={handleSignOut}
                  className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  Exit
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4">
            {children}
          </main>

          {/* Bottom Navigation - mobile only */}
          <nav className="bg-white border-t border-gray-200 lg:hidden">
            <div className="flex justify-around items-center h-16">
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
      </div>
    </div>
  )
}
