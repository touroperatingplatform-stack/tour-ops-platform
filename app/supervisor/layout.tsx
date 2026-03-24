'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Gray frame padding - space from screen edges */}
      <div className="flex-1 p-4 pb-20 overflow-hidden">
        {/* White bordered container - full width with visible border line */}
        <div className="mx-auto w-full h-full bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Top Navigation */}
          <header className="bg-gray-900 text-white border-b border-gray-800 flex-shrink-0">
            <div className="px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📡</span>
                <span className="font-semibold">Supervisor</span>
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

          {/* Page Content - scrolls inside container */}
          <main className="flex-1 p-4 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation - Fixed outside container at very bottom */}
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
