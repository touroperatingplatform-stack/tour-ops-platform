'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('Admin: No session')
          window.location.replace('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, is_active')
          .eq('id', session.user.id)
          .single()

        if (!profile) {
          console.log('Admin: No profile')
          window.location.replace('/login')
          return
        }

        if (!profile.is_active) {
          console.log('Admin: Inactive')
          window.location.replace('/login')
          return
        }

        const allowedRoles = ['super_admin', 'company_admin', 'supervisor', 'manager']
        if (!allowedRoles.includes(profile.role)) {
          console.log('Admin: Role not allowed:', profile.role)
          window.location.replace('/login')
          return
        }

        setProfile(profile)
        setLoading(false)
      } catch (err) {
        console.error('Admin auth error:', err)
        window.location.replace('/login')
      }
    }

    checkAuth()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#f9fafb' 
      }}>
        <p>Loading admin...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Admin</h1>
          {profile && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>{profile.full_name}</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#9ca3af' }}>{profile.role}</p>
            </div>
          )}
        </div>

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
