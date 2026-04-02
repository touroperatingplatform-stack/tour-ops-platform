'use client'

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
      
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
              </div>
              <div className="border-8 border-transparent">
                <button className="border-8 border-transparent bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Add Brand
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0 overflow-auto">
            {loading ? (
              <div className="border-8 border-transparent flex items-center justify-center h-full">
                <div className="border-8 border-transparent">
                  <p className="text-gray-500">Loading...</p>
                </div>
              </div>
            ) : (
              <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 gap-4">
                {brands.length === 0 ? (
                  <div className="border-8 border-transparent col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                    <p>No brands yet</p>
                  </div>
                ) : (
                  brands.map((brand) => (
                    <div key={brand.id} className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-4">
                      <div className="border-8 border-transparent flex items-start justify-between mb-3">
                        <div className="border-8 border-transparent">
                          <h3 className="border-8 border-transparent font-semibold text-gray-900">{brand.name}</h3>
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-500">{brand.slug}</p>
                          </div>
                        </div>
                        <div className="border-8 border-transparent">
                          <button className="border-8 border-transparent text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        </div>
                      </div>
                      <div className="border-8 border-transparent flex items-center gap-2">
                        <div className="border-8 border-transparent w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: brand.primary_color }} />
                        <div className="border-8 border-transparent">
                          <span className="text-sm text-gray-600">{brand.primary_color}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
