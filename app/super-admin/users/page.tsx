'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  status: string
  created_at: string
  company_id: string | null
  company_name: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  roleCounts['all'] = users.length

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole)

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Platform Users</h1>
              </div>
              <div className="border-8 border-transparent">
                <p className="text-gray-600 text-sm mt-1">Manage all users across the platform</p>
              </div>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="border-8 border-transparent flex-none mb-4">
            <div className="border-8 border-transparent flex gap-2 overflow-x-auto">
              {Object.entries(roleCounts).map(([role, count]) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`border-8 border-transparent px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterRole === role
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {role === 'all' ? 'All Users' : role.replace('_', ' ')} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0">
            <div className="border-8 border-transparent h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="border-8 border-transparent overflow-auto h-full">
                <table className="border-8 border-transparent w-full">
                  <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="border-8 border-transparent divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-8 border-transparent hover:bg-gray-50">
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <div className="border-8 border-transparent">
                              <p className="text-sm font-medium text-gray-900">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : user.email
                                }
                              </p>
                            </div>
                            <div className="border-8 border-transparent">
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <span className={`border-8 border-transparent px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'company_admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'operations' || user.role === 'supervisor' || user.role === 'manager' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          {user.company_name ? (
                            <div className="border-8 border-transparent">
                              <span className="text-sm text-gray-900">{user.company_name}</span>
                            </div>
                          ) : (
                            <div className="border-8 border-transparent">
                              <span className="text-sm text-gray-400 italic">No company</span>
                            </div>
                          )}
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <span className={`border-8 border-transparent px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
