'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation - Same as Guide */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Supervisor</h1>
              <p className="text-xs text-gray-500">Operations Dashboard</p>
            </div>
          </div>
          
          {/* User menu */}
          <Link 
            href="/guide" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Switch to Guide →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation - Same as Guide */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-4 min-w-[64px] ${
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
