'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
  { href: '/admin/import', label: 'CSV Import', icon: '📥' },
  { href: '/import/orden', label: 'ORDEN Import', icon: '📋' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminTopNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const currentPage = allMenuItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || 'Dashboard'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left - Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <div>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </div>
          </div>

          {/* Right - Language + User */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                👤
              </button>

              {/* Dropdown */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      {t('common.profile')}
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      {t('common.settings')}
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { handleSignOut(); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {t('common.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
