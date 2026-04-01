'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RoleGuard from '@/lib/auth/RoleGuard'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { supabase } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  showBottomNav?: boolean
  activeNav?: 'dashboard' | 'tours' | 'guests' | 'reports' | 'menu'
}

export default function AdminLayout({ 
  children, 
  title, 
  showBottomNav = true,
  activeNav 
}: AdminLayoutProps) {
  const router = useRouter()
  const { t } = useTranslation()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { key: 'dashboard', href: '/admin', icon: '📊', label: t('nav.dashboard') },
    { key: 'tours', href: '/admin/tours', icon: '🚌', label: t('nav.tours') },
    { key: 'guests', href: '/admin/guests', icon: '👤', label: t('nav.guests') },
    { key: 'reports', href: '/admin/reports', icon: '📈', label: t('nav.reports') },
    { key: 'menu', href: '/admin/settings', icon: '⚙️', label: t('common.menu') },
  ]

  return (
    <RoleGuard requiredRole="company_admin">
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Top Nav */}
        <header className="bg-white flex-shrink-0">
          <div className="px-4 py-3 border-8 border-transparent">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  T
                </div>
                <h1 className="text-lg font-bold">{title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <button 
                  onClick={handleSignOut}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  👤
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
          <div className="h-full overflow-auto p-3 border-8 border-transparent">
            {children}
          </div>
        </main>

        {/* Bottom Nav */}
        {showBottomNav && (
          <nav className="flex-none bg-white z-50">
            <div className="flex justify-around items-center px-2 py-2">
              {navItems.map((item) => (
                <Link 
                  key={item.key}
                  href={item.href} 
                  className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${activeNav === item.key ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </RoleGuard>
  )
}