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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('company_id', profile.company_id)
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
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.team')}</h1>
            <p className="text-sm text-gray-500">{t('users.manageStaff')}</p>
          </div>
          <Link 
            href="/admin/users/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            + {t('common.add')}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">{t('common.total')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.guides}</p>
            <p className="text-sm text-gray-500">{t('roles.guide')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.drivers}</p>
            <p className="text-sm text-gray-500">{t('roles.driver')}</p>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.role')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {t(`roles.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      {t('users.noUsers') || 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
