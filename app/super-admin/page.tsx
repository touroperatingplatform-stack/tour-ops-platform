'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'
import { getLocalDate } from '@/lib/timezone'

interface PlatformStats {
  totalClients: number
  totalCompanies: number
  totalUsers: number
  activeToursToday: number
  totalGuestsToday: number
  openIncidents: number
  platformRevenue?: number
}

interface ClientSummary {
  id: string
  name: string
  email: string
  companies_count: number
  users_count: number
  status: string
  created_at: string
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
  const [recentClients, setRecentClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlatformStats()
  }, [])

  async function loadPlatformStats() {
    try {
      // Count clients (company_admin users)
      const { count: clientsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'company_admin')
      
      // Count companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
      
      // Count all users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      // Count today's tours (use local date for Cancun timezone)
      const today = getLocalDate()
      const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]
      const { count: toursCount } = await supabase
        .from('tours')
        .select('*', { count: 'exact', head: true })
        .in('tour_date', [today, tomorrow])
      
      // Count today's guests
      const { data: todaysTours } = await supabase
        .from('tours')
        .select('id')
        .in('tour_date', [today, tomorrow])
      
      let guestsCount = 0
      if (todaysTours && todaysTours.length > 0) {
        const tourIds = todaysTours.map(t => t.id)
        const { count } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .in('tour_id', tourIds)
        guestsCount = count || 0
      }
      
      // Count open incidents
      const { count: incidentsCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['reported', 'acknowledged'])
      
      // Get recent clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at')
        .eq('role', 'company_admin')
        .order('created_at', { ascending: false })
        .limit(5)
      
      const clientSummaries: ClientSummary[] = clientsData?.map(c => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
        email: c.email,
        companies_count: 0, // Will fetch separately
        users_count: 0,     // Will fetch separately
        status: 'active',
        created_at: c.created_at || ''
      })) || []
      
      // Fetch company counts per client
      for (let i = 0; i < clientSummaries.length; i++) {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('company_admin_id', clientSummaries[i].id)
        clientSummaries[i].companies_count = count || 0
      }
      
      setStats({
        totalClients: clientsCount || 0,
        totalCompanies: companiesCount || 0,
        totalUsers: usersCount || 0,
        activeToursToday: toursCount || 0,
        totalGuestsToday: guestsCount,
        openIncidents: incidentsCount || 0
      })
      
      setRecentClients(clientSummaries)
    } catch (error) {
      console.error('Error loading platform stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading platform stats...</div>
          </div>
        ) : (
          <>
            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                    <p className="text-3xl font-bold">{stats.totalClients}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Companies</p>
                    <p className="text-3xl font-bold">{stats.totalCompanies}</p>
                  </div>
                  <div className="text-4xl">🏢</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div className="text-4xl">👤</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tours Today</p>
                    <p className="text-3xl font-bold">{stats.activeToursToday}</p>
                  </div>
                  <div className="text-4xl">🚌</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Guests Today</p>
                    <p className="text-3xl font-bold">{stats.totalGuestsToday}</p>
                  </div>
                  <div className="text-4xl">👨‍👩‍👧‍👦</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Open Incidents</p>
                    <p className="text-3xl font-bold text-red-600">{stats.openIncidents}</p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>
            </div>

            {/* Recent Clients */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Recent Clients</h2>
                  <Link 
                    href="/super-admin/clients"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Companies
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
                    {recentClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {client.companies_count} companies
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {recentClients.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No clients yet. Create your first client to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/super-admin/clients" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">👥</div>
                  <h3 className="text-lg font-semibold">Manage Clients</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Create and manage client accounts. Set feature flags and usage limits.
                </p>
              </Link>

              <Link href="/super-admin/companies" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🏢</div>
                  <h3 className="text-lg font-semibold">Company Registry</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  View all companies across the platform. Read-only overview.
                </p>
              </Link>

              <Link href="/super-admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">👤</div>
                  <h3 className="text-lg font-semibold">Platform Users</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Manage super admin users and platform access.
                </p>
              </Link>

              <Link href="/super-admin/demo" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">📦</div>
                  <h3 className="text-lg font-semibold">Demo Data</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Generate or clear demo data for client trials.
                </p>
              </Link>

              <Link href="/super-admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">⚙️</div>
                  <h3 className="text-lg font-semibold">Platform Settings</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Configure platform-wide defaults and settings.
                </p>
              </Link>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}
