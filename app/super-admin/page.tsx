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
      // Load all data in parallel where possible
      const [
        companiesData,
        profilesData,
        toursData,
        incidentsData
      ] = await Promise.all([
        supabase.from('companies').select('company_admin_id'),
        supabase.from('profiles').select('id, company_id, role'),
        supabase.from('tours').select('id, status'),
        supabase.from('incidents').select('id, status')
      ])

      // Get unique admin IDs from companies
      const adminIds = [...new Set(companiesData.data?.map(c => c.company_admin_id).filter(Boolean) || [])]

      // Build company -> admin mapping
      const companyToAdmin: Record<string, string> = {}
      companiesData.data?.forEach((c: any) => {
        if (c.company_admin_id && c.id) {
          companyToAdmin[c.id] = c.company_admin_id
        }
      })

      // Count companies per admin
      const companyCountMap: Record<string, number> = {}
      companiesData.data?.forEach((c: any) => {
        if (c.company_admin_id) {
          companyCountMap[c.company_admin_id] = (companyCountMap[c.company_admin_id] || 0) + 1
        }
      })

      // Count users per admin
      const userCountMap: Record<string, number> = {}
      profilesData.data?.forEach((p: any) => {
        if (p.role !== 'super_admin' && p.company_id) {
          const adminId = companyToAdmin[p.company_id]
          if (adminId) {
            userCountMap[adminId] = (userCountMap[adminId] || 0) + 1
          }
        }
      })

      // Count tours in progress
      const activeTours = toursData.data?.filter(t => t.status === 'in_progress').length || 0

      // Count open incidents
      const openIncidents = incidentsData.data?.filter(i => i.status === 'reported' || i.status === 'open').length || 0

      setStats({
        totalClients: adminIds.length,
        totalCompanies: companiesData.data?.length || 0,
        totalUsers: profilesData.data?.length || 0,
        activeToursToday: activeTours,
        totalGuestsToday: 0, // Would need separate query
        openIncidents: openIncidents
      })

      // Get recent clients (first 10 admins with profiles)
      const recentClientsList = adminIds.slice(0, 10).map(adminId => {
        const profile = profilesData.data?.find((p: any) => p.id === adminId)
        return {
          id: adminId,
          email: profile?.email || 'Unknown',
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          phone: profile?.phone || null,
          status: profile?.status || 'active',
          created_at: profile?.created_at || new Date().toISOString(),
          companies_count: companyCountMap[adminId] || 0,
          users_count: userCountMap[adminId] || 0
        }
      }).filter(c => c.email !== 'Unknown')

      setRecentClients(recentClientsList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full flex flex-col gap-6">

        {/* Platform Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                  <p className="text-3xl font-bold">{stats.totalClients}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold">{stats.totalCompanies}</p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="text-4xl">👤</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tours Today</p>
                  <p className="text-3xl font-bold">{stats.activeToursToday}</p>
                </div>
                <div className="text-4xl">🚌</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Guests Today</p>
                  <p className="text-3xl font-bold">{stats.totalGuestsToday}</p>
                </div>
                <div className="text-4xl">👨‍👩‍👧‍👦</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Open Incidents</p>
                  <p className="text-3xl font-bold text-red-600">{stats.openIncidents}</p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
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
            <div className="overflow-auto h-[calc(100%-73px)]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.first_name || client.last_name
                            ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
                            : client.email
                          }
                        </div>
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
        </div>

        {/* Quick Actions */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/super-admin/clients" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">👥</div>
                <h3 className="text-lg font-semibold">Manage Clients</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create and manage client accounts. Set feature flags and usage limits.
              </p>
            </Link>

            <Link href="/super-admin/companies" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🏢</div>
                <h3 className="text-lg font-semibold">Company Registry</h3>
              </div>
              <p className="text-gray-600 text-sm">
                View all companies across the platform. Read-only overview.
              </p>
            </Link>

            <Link href="/super-admin/users" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">👤</div>
                <h3 className="text-lg font-semibold">Platform Users</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Manage super admin users and platform access.
              </p>
            </Link>

            <Link href="/super-admin/demo" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📦</div>
                <h3 className="text-lg font-semibold">Demo Data</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Generate or clear demo data for client trials.
              </p>
            </Link>

            <Link href="/super-admin/settings" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">⚙️</div>
                <h3 className="text-lg font-semibold">Platform Settings</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Configure platform-wide defaults and settings.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
