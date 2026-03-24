'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  role: string
}

const navItems = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/vehicles', label: 'Vehicles', icon: '🚐' },
  { href: '/admin/checklists', label: 'Checklists', icon: '✅' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

      if (!profile || !['super_admin', 'company_admin', 'supervisor', 'manager'].includes(profile.role)) {
        router.push('/login')
        return
      }

      setProfile(profile)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '256px',
        backgroundColor: '#111827',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Admin</h1>
          {profile && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>{profile.full_name}</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#9ca3af' }}>{profile.role}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  color: isActive ? '#ffffff' : '#9ca3af',
                  backgroundColor: isActive ? '#1f2937' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div style={{ padding: '16px', borderTop: '1px solid #374151' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 24px',
              color: '#9ca3af',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '256px',
        flex: 1,
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
        padding: '32px',
      }}>
        {children}
      </main>
    </div>
  )
}