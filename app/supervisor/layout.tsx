'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TopNav from './components/TopNav'

const navItems = [
  { href: '/supervisor', label: 'Dashboard', icon: '📊' },
  { href: '/supervisor/guides', label: 'Guides', icon: '👥' },
  { href: '/supervisor/expenses', label: 'Expenses', icon: '💵' },
  { href: '/supervisor/incidents', label: 'Incidents', icon: '🚨' },
]

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkRole()
  }, [])

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['supervisor', 'manager', 'admin'].includes(profile?.role)) {
      router.push('/unauthorized')
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Top Navigation */}
      <TopNav />

      {/* Scrollable Content - Fills remaining space */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="w-full h-full overflow-auto">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-4 min-w-[64px] ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
