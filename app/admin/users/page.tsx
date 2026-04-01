'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
}

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ total: 0, guides: 0, drivers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('status', 'active')
      .order('role')

    if (error) {
      console.error('Error loading users:', error)
    } else {
      setUsers(data || [])
      setStats({
        total: data?.length || 0,
        guides: data?.filter((u: User) => u.role === 'guide').length || 0,
        drivers: data?.filter((u: User) => u.role === 'driver').length || 0
      })
    }
    setLoading(false)
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'guide': return '🎯'
      case 'driver': return '🚗'
      case 'supervisor': return '👁️'
      case 'operations': return '📊'
      case 'company_admin': return '⚡'
      default: return '👤'
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'guide': return 'bg-green-100 text-green-700'
      case 'driver': return 'bg-blue-100 text-blue-700'
      case 'supervisor': return 'bg-purple-100 text-purple-700'
      case 'operations': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('nav.team')}</h1>
              <p className="text-gray-500 text-sm">{t('users.manageStaff')}</p>
            </div>
            <Link 
              href="/admin/users/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + {t('common.add')}
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">{t('common.total')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.guides}</div>
            <div className="text-gray-500 text-xs">{t('roles.guide')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.drivers}</div>
            <div className="text-gray-500 text-xs">{t('roles.driver')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="space-y-2">
            {users.map(user => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                    {getRoleIcon(user.role)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold">{user.first_name} {user.last_name}</h3>
                    <p className="text-gray-500 text-sm truncate">{user.email}</p>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                    {t(`roles.${user.role}`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">👥</span>
            <span className="text-xs">{t('nav.team')}</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-xs">{t('profile.settings')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}