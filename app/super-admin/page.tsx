'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
}

interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  primary_color: string
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'brands' | 'settings'>('companies')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: companiesData } = await supabase.from('companies').select('*').order('created_at')
    const { data: brandsData } = await supabase.from('brands').select('*').order('created_at')
    
    setCompanies(companiesData || [])
    setBrands(brandsData || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform configuration and company management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'brands'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Companies</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Company
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {companies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No companies yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Brands</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{company.name}</p>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                              {company.id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">
                                {brands.filter(b => b.company_id === company.id).length} brand(s)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Brands</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Brand
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                          <p className="text-sm text-gray-500">{brand.slug}</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.primary_color }} />
                        <span className="text-sm text-gray-600">{brand.primary_color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Google Drive Integration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID</label>
                        <input
                          type="text"
                          placeholder="Your Google OAuth Client ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client Secret</label>
                        <input
                          type="password"
                          placeholder="Your Google OAuth Client Secret"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Drive Folder ID</label>
                        <input
                          type="text"
                          placeholder="Root folder ID for media storage"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Save Google Drive Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
