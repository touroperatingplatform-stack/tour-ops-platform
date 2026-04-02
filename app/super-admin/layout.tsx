'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const navItems = [
  { href: '/super-admin', label: 'Dashboard', icon: '📊' },
  { href: '/super-admin/clients', label: 'Clients', icon: '👥' },
  { href: '/super-admin/companies', label: 'Companies', icon: '🏢' },
  { href: '/super-admin/regional-data', label: 'Regional', icon: '🗺️' },
  { href: '/super-admin/import', label: 'Import', icon: '📥' },
  { href: '/super-admin/system', label: 'System', icon: '💚' },
  { href: '/super-admin/demo', label: 'Demo Data', icon: '📦' },
  { href: '/super-admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
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

    if (profile?.role !== 'super_admin') {
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-bold text-gray-900">Super Admin</span>
            </div>

            {/* Center - Page Title */}
            <h1 className="hidden md:block font-semibold text-gray-700">
              {pathname === '/super-admin' ? 'Platform Dashboard' :
               pathname.includes('/clients') ? 'Client Management' :
               pathname.includes('/companies') ? 'Company Registry' :
               pathname.includes('/regional-data') ? 'Regional Data' :
               pathname.includes('/demo') ? 'Demo Data' :
               pathname.includes('/settings') ? 'Platform Settings' :
               'Super Admin'}
            </h1>

            {/* Right - User Info */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto px-4 sm:px-6 lg:px-12 py-4">
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
                  isActive ? 'text-purple-600' : 'text-gray-500'
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
