'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import NotificationsDropdown from '@/components/NotificationsDropdown'

const bottomNavItems = [
  { href: '/operations', label: 'Today', icon: '📅' },
  { href: '/operations/fleet', label: 'Fleet', icon: '🚐' },
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-900 text-white z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="font-semibold">Operations</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-300 hover:text-white"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
