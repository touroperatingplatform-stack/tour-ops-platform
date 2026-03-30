'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/test', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
]

const moreItems = [
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/checklists', label: 'Checklists', icon: '☑️' },
  { href: '/admin/guides', label: 'Guides', icon: '🎯' },
  { href: '/admin/templates', label: 'Templates', icon: '📋' },
  { href: '/admin/data', label: 'Data', icon: '💾' },
  { href: '/admin/import', label: 'Import', icon: '📥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const allMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/checklists', label: 'Checklists', icon: '☑️' },
  { href: '/admin/guides', label: 'Guides', icon: '🎯' },
  { href: '/admin/templates', label: 'Templates', icon: '📋' },
  { href: '/admin/data', label: 'Data', icon: '💾' },
  { href: '/admin/import', label: 'Import', icon: '📥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayoutNew({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showMore, setShowMore] = useState(false)

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

    if (!['company_admin', 'super_admin'].includes(profile?.role)) {
      router.push('/unauthorized')
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  const currentPage = allMenuItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Dashboard'

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
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
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back + Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </div>

            {/* Right - User Menu */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto px-6 py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
              showMore ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">☰</span>
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">Menu</span>
                <button 
                  onClick={() => setShowMore(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                      isActive(item.href) 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
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
