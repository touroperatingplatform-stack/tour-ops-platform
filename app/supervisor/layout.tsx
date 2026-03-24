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
    <div className="min-h-screen bg-gray-100 py-4 px-4">
      {/* Centered Container with Border */}
      <div className="max-w-md mx-auto bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-2rem)]">
        
        {/* Top Navigation - Above content, scrolls together */}
        <header className="bg-gray-900 text-white border-b border-gray-800">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📡</span>
              <span className="font-semibold">Supervisor</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-sm text-gray-300 hover:text-white"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-gray-200">
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
  )
}
