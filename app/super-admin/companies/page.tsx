'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  company_admin_email: string | null
  created_at: string
  tours_count: number
  users_count: number
  vehicles_count: number
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    setLoading(true)
    try {
      // Get companies
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get counts for each company
      const [toursData, profilesData, vehiclesData] = await Promise.all([
        supabase.from('tours').select('company_id'),
        supabase.from('profiles').select('company_id'),
        supabase.from('vehicles').select('company_id')
      ])

      // Get admin profiles
      const adminIds = companiesData?.map(c => c.company_admin_id).filter(Boolean) || []
      let adminsMap: Record<string, string> = {}
      if (adminIds.length > 0) {
        const { data: adminsData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', adminIds)
        adminsData?.forEach(a => { adminsMap[a.id] = a.email })
      }

      // Count tours per company
      const toursCountMap: Record<string, number> = {}
      toursData?.data?.forEach((t: any) => {
        if (t.company_id) {
          toursCountMap[t.company_id] = (toursCountMap[t.company_id] || 0) + 1
        }
      })

      // Count profiles per company
      const profilesCountMap: Record<string, number> = {}
      profilesData?.data?.forEach((p: any) => {
        if (p.company_id) {
          profilesCountMap[p.company_id] = (profilesCountMap[p.company_id] || 0) + 1
        }
      })

      // Count vehicles per company
      const vehiclesCountMap: Record<string, number> = {}
      vehiclesData?.data?.forEach((v: any) => {
        if (v.company_id) {
          vehiclesCountMap[v.company_id] = (vehiclesCountMap[v.company_id] || 0) + 1
        }
      })

      const companiesWithCounts = (companiesData || []).map((company: any) => ({
        ...company,
        company_admin_email: adminsMap[company.company_admin_id] || null,
        tours_count: toursCountMap[company.id] || 0,
        users_count: profilesCountMap[company.id] || 0,
        vehicles_count: vehiclesCountMap[company.id] || 0
      }))

      setCompanies(companiesWithCounts)
    } catch (error) {
      console.error('Error loading companies:', error)
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
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Company Registry</h1>
              </div>
              <div className="border-8 border-transparent">
                <p className="text-gray-600 text-sm mt-1">View all companies across the platform</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0">
            <div className="border-8 border-transparent h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="border-8 border-transparent overflow-auto h-full">
                <table className="border-8 border-transparent w-full">
                  <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tours</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="border-8 border-transparent divide-y divide-gray-200">
                    {companies.map((company) => (
                      <tr key={company.id} className="border-8 border-transparent hover:bg-gray-50">
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent flex items-center">
                            {company.logo_url && (
                              <div className="border-8 border-transparent mr-3">
                                <img 
                                  src={company.logo_url} 
                                  alt={company.name}
                                  className="border-8 border-transparent w-10 h-10 rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <div className="border-8 border-transparent">
                              <div className="border-8 border-transparent">
                                <p className="text-sm font-medium text-gray-900">{company.name}</p>
                              </div>
                              <div className="border-8 border-transparent">
                                <p className="text-sm text-gray-500">{company.slug}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          {company.company_admin_email ? (
                            <div className="border-8 border-transparent">
                              <p className="text-sm text-gray-900">{company.company_admin_email}</p>
                            </div>
                          ) : (
                            <div className="border-8 border-transparent">
                              <span className="text-sm text-gray-400 italic">No owner assigned</span>
                            </div>
                          )}
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/operations?company=${company.id}`}
                            className="border-8 border-transparent text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {company.tours_count} tours
                          </Link>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <span className="text-sm text-gray-900">{company.users_count} users</span>
                          </div>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <span className="text-sm text-gray-900">{company.vehicles_count} vehicles</span>
                          </div>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-500">{new Date(company.created_at).toLocaleDateString()}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                          No companies found
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
