'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { hasRole, type Role } from './roles'

export interface NavItem {
  href: string
  label: string
  icon: string
  minRole?: Role  // Minimum role required to see this item
}

interface RoleNavProps {
  items: NavItem[]
  userRole?: Role
  children: (filteredItems: NavItem[], userRole: Role | null, loading: boolean) => React.ReactNode
}

export default function RoleNav({ items, userRole: explicitRole, children }: RoleNavProps) {
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserRole() {
      if (explicitRole) {
        setUserRole(explicitRole)
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUserRole(null)
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setUserRole(profile?.role as Role | null)
      } catch (error) {
        console.error('RoleNav: Failed to get user role:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()
  }, [explicitRole])

  // Filter items based on user's role
  const filteredItems = items.filter(item => {
    if (!item.minRole) return true  // No role requirement
    if (!userRole) {
      console.log('RoleNav: No user role, filtering out:', item.label)
      return false
    }
    const allowed = hasRole(userRole, item.minRole)
    console.log('RoleNav:', item.label, 'minRole:', item.minRole, 'userRole:', userRole, 'allowed:', allowed)
    return allowed
  })

  return <>{children(filteredItems, userRole, loading)}</>
}

// Predefined navigation configurations for different dashboards
export const NAV_CONFIGS = {
  // Super Admin Navigation
  super_admin: [
    { href: '/super-admin', label: 'Dashboard', icon: '🎛️', minRole: 'super_admin' as Role },
    { href: '/super-admin/companies', label: 'Companies', icon: '🏢', minRole: 'super_admin' as Role },
    { href: '/super-admin/brands', label: 'Brands', icon: '🏷️', minRole: 'super_admin' as Role },
    { href: '/super-admin/users', label: 'Users', icon: '👥', minRole: 'super_admin' as Role },
    { href: '/super-admin/demo', label: 'Demo Data', icon: '📦', minRole: 'super_admin' as Role },
    { href: '/super-admin/settings', label: 'Settings', icon: '⚙️', minRole: 'super_admin' as Role },
  ] as NavItem[],

  // Operations Navigation
  operations: [
    { href: '/operations', label: 'Dashboard', icon: '📊', minRole: 'operations' as Role },
    { href: '/operations/vehicles', label: 'Vehicles', icon: '🚌', minRole: 'operations' as Role },
    { href: '/operations/schedule', label: 'Schedule', icon: '📅', minRole: 'operations' as Role },
    { href: '/operations/reports', label: 'Reports', icon: '📈', minRole: 'operations' as Role },
  ] as NavItem[],

  // Supervisor Navigation
  supervisor: [
    { href: '/supervisor', label: 'Dashboard', icon: '📊', minRole: 'supervisor' as Role },
    { href: '/supervisor/tours', label: 'Tours', icon: '🚌', minRole: 'supervisor' as Role },
    { href: '/supervisor/guides', label: 'Guides', icon: '👨‍🏫', minRole: 'supervisor' as Role },
    { href: '/supervisor/incidents', label: 'Incidents', icon: '🚨', minRole: 'supervisor' as Role },
    { href: '/supervisor/reports', label: 'Reports', icon: '📈', minRole: 'manager' as Role },
  ] as NavItem[],

  // Guide Navigation
  guide: [
    { href: '/guide', label: 'Dashboard', icon: '📊', minRole: 'guide' as Role },
    { href: '/guide/tours', label: 'My Tours', icon: '🚌', minRole: 'guide' as Role },
    { href: '/guide/checkin', label: 'Check In', icon: '✅', minRole: 'guide' as Role },
    { href: '/guide/expenses', label: 'Expenses', icon: '💵', minRole: 'guide' as Role },
  ] as NavItem[],
}
