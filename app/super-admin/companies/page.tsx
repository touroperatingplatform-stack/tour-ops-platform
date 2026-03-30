'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  company_admin_id: string | null
  company_admin_email: string | null
  tours_count: number
  users_count: number
  vehicles_count: number
}

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url, created_at, company_admin_id')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const companyList: Company[] = []
      for (const company of companiesData || []) {
        // Get company admin email
        let adminEmail = null
        if (company.company_admin_id) {
          const { data: admin } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', company.company_admin_id)
            .single()
          adminEmail = admin?.email || null
        }
        
        // Count tours
        const { count: toursCount } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
        
        // Count users (profiles with this company_id)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
        
        // Count vehicles
        const { count: vehiclesCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
        
        companyList.push({
          id: company.id,
          name: company.name,
          slug: company.slug,
          logo_url: company.logo_url,
          created_at: company.created_at || '',
          company_admin_id: company.company_admin_id,
          company_admin_email: adminEmail,
          tours_count: toursCount || 0,
          users_count: usersCount || 0,
          vehicles_count: vehiclesCount || 0
        })
      }
      
      setCompanies(companyList)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Company Registry</h1>
              <p className="text-gray-600 text-sm">View all companies across the platform</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading companies...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {company.logo_url && (
                          <img 
                            src={company.logo_url} 
                            alt={company.name}
                            className="w-10 h-10 rounded-lg mr-3 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.company_admin_email ? (
                        <div className="text-sm text-gray-900">{company.company_admin_email}</div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No owner assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/operations?company=${company.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {company.tours_count} tours
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{company.users_count} users</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{company.vehicles_count} vehicles</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No companies found
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
