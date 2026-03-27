'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  primary_color: string
}

export default function SuperAdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: brandsData } = await supabase.from('brands').select('*').order('created_at')
    setBrands(brandsData || [])
    setLoading(false)
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + Add Brand
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brands.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                  <p>No brands yet</p>
                </div>
              ) : (
                brands.map((brand) => (
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
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
