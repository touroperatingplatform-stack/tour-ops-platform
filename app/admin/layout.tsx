'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getProfile, signOut } from '@/lib/auth'
import { Profile } from '@/lib/supabase/types'

const sidebarItems = [
  { href: '/admin', label: 'Overview', icon: '🏠' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tours', label: 'Tours', icon: '📅' },
  { href: '/admin/vehicles', label: 'Vehicles', icon: '🚗' },
  { href: '/admin/checklists', label: 'Checklists', icon: '☑️' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️', adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️', adminOnly: true },
]

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'supervisor':
    case 'manager':
      return '/supervisor'
    case 'operations':
      return '/operations'
    case 'guide':
      return '/guide'
    default:
      return '/login'
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const p = await getProfile()
      if (!p) {
        router.push('/login')
        return
      }
      if (!['super_admin', 'company_admin'].includes(p.role)) {
        router.push(getRoleRedirect(p.role))
        return
      }
      setProfile(p)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Tour Ops Admin</h1>
          <p className="text-gray-400 text-sm mt-1">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-gray-500 text-xs capitalize">
            {profile?.role?.replace('_', ' ')}
          </p>
        </div>

        <nav className="flex-1 py-4">
          {sidebarItems.map((item) => {
            if (item.adminOnly && !isSuperAdmin) return null
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-gray-100 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
