'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'

const navItems = [
  { href: '/super-admin', labelKey: 'nav.dashboard', icon: '📊' },
  { href: '/super-admin/clients', labelKey: 'nav.clients', icon: '👥' },
  { href: '/super-admin/companies', labelKey: 'nav.companies', icon: '🏢' },
]

const moreItems = [
  { href: '/super-admin/regional-data', labelKey: 'nav.regional', icon: '🗺️' },
  { href: '/super-admin/brands', labelKey: 'nav.brands', icon: '🏷️' },
  { href: '/super-admin/checklist-presets', labelKey: 'nav.checklistPresets', icon: '📋' },
  { href: '/super-admin/activities', labelKey: 'nav.activities', icon: '🏃' },
  { href: '/super-admin/activity-checklist-assignment', labelKey: 'nav.assignment', icon: '🔗' },
  { href: '/super-admin/users', labelKey: 'nav.users', icon: '👤' },
  { href: '/super-admin/demo', labelKey: 'nav.demoData', icon: '📦' },
  { href: '/super-admin/import', labelKey: 'nav.import', icon: '📥' },
  { href: '/super-admin/settings', labelKey: 'nav.settings', icon: '⚙️' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

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

  const isActive = (href: string) => {
    if (href === '/super-admin') return pathname === '/super-admin'
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation - No border */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-bold text-gray-900">{t('nav.superAdmin')}</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <LanguageToggle />

              {/* Notifications */}
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 relative">
                🔔
              </button>

              {/* User Button */}
              <button
                onClick={() => setShowUserMenu(true)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-4 border-transparent">
        <div className="w-full h-full overflow-auto px-10 py-6 border-4 border-transparent">
          <div className="h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
                  active ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{t(item.labelKey)}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500"
          >
            <span className="text-xl mb-1">☰</span>
            <span className="text-xs">{t('nav.menu')}</span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-white z-50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-center mb-4 p-4">
                <span className="font-bold text-2xl">{t('nav.menu')}</span>
                <button 
                  onClick={() => setShowMore(false)}
                  className="absolute right-10 p-4 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4 p-2">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-gray-600 hover:bg-gray-50 bg-gray-50 h-full"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Menu */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="fixed top-20 right-8 w-64 bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-2">
              <div className="border-b pb-3 mb-3">
                <div className="flex flex-col items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    👤
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Super Admin</p>
                    <p className="text-xs text-gray-500">Platform Admin</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-sm">Profile</span>
                </Link>
                <Link
                  href="/super-admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-2xl">⚙️</span>
                  <span className="text-sm">Settings</span>
                </Link>
                <button
                  onClick={() => { handleSignOut(); setShowUserMenu(false); }}
                  className="w-full flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-2xl">🚪</span>
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
