'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  company_id: string | null
  company_name: string | null
  status: string
  created_at: string
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, company_id, status, created_at')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const userList: User[] = []
      for (const user of usersData || []) {
        // Get company name
        let companyName = null
        if (user.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', user.company_id)
            .single()
          companyName = company?.name || null
        }
        
        userList.push({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          company_id: user.company_id,
          company_name: companyName,
          status: user.status || 'active',
          created_at: user.created_at || ''
        })
      }
      
      setUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole)

  const roleCounts = {
    all: users.length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
    company_admin: users.filter(u => u.role === 'company_admin').length,
    operations: users.filter(u => u.role === 'operations').length,
    supervisor: users.filter(u => u.role === 'supervisor').length,
    manager: users.filter(u => u.role === 'manager').length,
    guide: users.filter(u => u.role === 'guide').length,
    driver: users.filter(u => u.role === 'driver').length
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Platform Users</h1>
              <p className="text-gray-600 text-sm">Manage all users across the platform</p>
            </div>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {Object.entries(roleCounts).map(([role, count]) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filterRole === role
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {role === 'all' ? 'All Users' : role.replace('_', ' ')} ({count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading users...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : user.email
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'company_admin' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'operations' || user.role === 'supervisor' || user.role === 'manager' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.company_name ? (
                        <span className="text-sm text-gray-900">{user.company_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No company</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
