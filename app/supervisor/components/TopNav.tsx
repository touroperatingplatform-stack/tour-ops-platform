'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function TopNav() {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Get page title based on path
  const getPageTitle = () => {
    if (pathname === '/supervisor') return 'Dashboard'
    if (pathname.includes('/guides')) return 'Guides'
    if (pathname.includes('/expenses')) return 'Expense Approvals'
    if (pathname.includes('/incidents')) return 'Incident Management'
    return 'Supervisor'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-bold text-gray-900">Supervisor</span>
          </div>

          {/* Center - Page Title */}
          <h1 className="hidden md:block font-semibold text-gray-700">
            {getPageTitle()}
          </h1>

          {/* Right - User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                👤
              </span>
              <span className="hidden sm:block text-sm font-medium">Menu</span>
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
                    My Profile
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
