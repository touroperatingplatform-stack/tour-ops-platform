'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

interface PlatformStats {
  totalClients: number
  totalCompanies: number
  totalUsers: number
  activeToursToday: number
  totalGuestsToday: number
  openIncidents: number
}

interface ClientInfo {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  status: string
  created_at: string
  companies_count: number
  users_count: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalClients: 0,
    totalCompanies: 0,
    totalUsers: 0,
    activeToursToday: 0,
    totalGuestsToday: 0,
    openIncidents: 0
  })
  const [recentClients, setRecentClients] = useState<ClientInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Load counts in parallel
      const [
        clientsResult,
        companiesResult,
        usersResult,
        toursResult,
        guestsResult,
        incidentsResult,
        recentClientsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'company_admin'),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tours').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('guests').select('*', { count: 'exact', head: true }),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'reported'),
        supabase
          .from('profiles')
          .select(`
            *,
            companies:companies(count),
            users:profiles!inner(count)
          `)
          .eq('role', 'company_admin')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      setStats({
        totalClients: clientsResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalUsers: usersResult.count || 0,
        activeToursToday: toursResult.count || 0,
        totalGuestsToday: guestsResult.count || 0,
        openIncidents: incidentsResult.count || 0
      })

      // Transform recent clients data
      if (recentClientsResult.data) {
        const clientsWithCounts = recentClientsResult.data.map((client: any) => ({
          id: client.id,
          email: client.email,
          first_name: client.first_name,
          last_name: client.last_name,
          phone: client.phone,
          status: client.status,
          created_at: client.created_at,
          companies_count: client.companies?.[0]?.count || 0,
          users_count: client.users?.[0]?.count || 0
        }))
        setRecentClients(clientsWithCounts)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="border-8 border-transparent flex-1 flex items-center justify-center">
              <div className="border-8 border-transparent">
                <p className="text-gray-500">Loading platform stats...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Platform Metrics */}
              <div className="border-8 border-transparent flex-none mb-4">
                <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Total Clients</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold">{stats.totalClients}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">👥</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Total Companies</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold">{stats.totalCompanies}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">🏢</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Total Users</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold">{stats.totalUsers}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">👤</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Tours Today</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold">{stats.activeToursToday}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">🚌</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Guests Today</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold">{stats.totalGuestsToday}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">👨‍👩‍👧‍👦</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center justify-between">
                        <div className="border-8 border-transparent">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-600">Open Incidents</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-3xl font-bold text-red-600">{stats.openIncidents}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent text-4xl">⚠️</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Clients */}
              <div className="border-8 border-transparent flex-1 min-h-0 mb-4">
                <div className="border-8 border-transparent h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="border-8 border-transparent p-4 border-b border-gray-200">
                    <div className="border-8 border-transparent flex items-center justify-between">
                      <div className="border-8 border-transparent">
                        <h2 className="text-xl font-semibold">Recent Clients</h2>
                      </div>
                      <div className="border-8 border-transparent">
                        <Link
                          href="/super-admin/clients"
                          className="border-8 border-transparent text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View All →
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="border-8 border-transparent overflow-auto h-[calc(100%-73px)]">
                    <table className="border-8 border-transparent w-full">
                      <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="border-8 border-transparent divide-y divide-gray-200">
                        {recentClients.map((client) => (
                          <tr key={client.id} className="border-8 border-transparent hover:bg-gray-50">
                            <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                              <div className="border-8 border-transparent">
                                <p className="text-sm font-medium text-gray-900">
                                  {client.first_name || client.last_name
                                    ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
                                    : client.email
                                  }
                                </p>
                              </div>
                              <div className="border-8 border-transparent">
                                <p className="text-sm text-gray-500">{client.email}</p>
                              </div>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                              <span className="border-8 border-transparent px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {client.companies_count} companies
                              </span>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                              <span className="border-8 border-transparent px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {client.status}
                              </span>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-500">{new Date(client.created_at).toLocaleDateString()}</p>
                            </td>
                          </tr>
                        ))}
                        {recentClients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                              No clients yet. Create your first client to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-8 border-transparent flex-none">
                <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/super-admin/clients" className="border-8 border-transparent bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center mb-4">
                        <div className="border-8 border-transparent text-3xl mr-3">👥</div>
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent text-lg font-semibold">Manage Clients</h3>
                        </div>
                      </div>
                      <div className="border-8 border-transparent">
                        <p className="text-gray-600 text-sm">Create and manage client accounts. Set feature flags and usage limits.</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/super-admin/companies" className="border-8 border-transparent bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center mb-4">
                        <div className="border-8 border-transparent text-3xl mr-3">🏢</div>
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent text-lg font-semibold">Company Registry</h3>
                        </div>
                      </div>
                      <div className="border-8 border-transparent">
                        <p className="text-gray-600 text-sm">View all companies across the platform. Read-only overview.</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/super-admin/users" className="border-8 border-transparent bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center mb-4">
                        <div className="border-8 border-transparent text-3xl mr-3">👤</div>
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent text-lg font-semibold">Platform Users</h3>
                        </div>
                      </div>
                      <div className="border-8 border-transparent">
                        <p className="text-gray-600 text-sm">Manage super admin users and platform access.</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/super-admin/demo" className="border-8 border-transparent bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center mb-4">
                        <div className="border-8 border-transparent text-3xl mr-3">📦</div>
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent text-lg font-semibold">Demo Data</h3>
                        </div>
                      </div>
                      <div className="border-8 border-transparent">
                        <p className="text-gray-600 text-sm">Generate or clear demo data for client trials.</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/super-admin/settings" className="border-8 border-transparent bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent flex items-center mb-4">
                        <div className="border-8 border-transparent text-3xl mr-3">⚙️</div>
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent text-lg font-semibold">Platform Settings</h3>
                        </div>
                      </div>
                      <div className="border-8 border-transparent">
                        <p className="text-gray-600 text-sm">Configure platform-wide defaults and settings.</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
