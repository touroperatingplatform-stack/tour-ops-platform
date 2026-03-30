'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Brand {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrands()
  }, [])

  async function loadBrands() {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, slug, is_active')
      .order('name')

    if (error) {
      console.error('Error loading brands:', error)
    } else {
      setBrands(data || [])
      setStats({
        total: data?.length || 0,
        active: data?.filter((b: Brand) => b.is_active).length || 0
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading brands...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Brands</h1>
            <p className="text-gray-500 text-sm">Manage tour brands</p>
          </div>
          <Link 
            href="/admin/brands/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">Total Brands</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-gray-500 text-xs">Active</div>
          </div>
        </div>
      </div>

      {/* Brand List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {brands.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              No brands yet
            </div>
          ) : (
            brands.map(brand => (
              <Link
                key={brand.id}
                href={`/admin/brands/${brand.id}`}
                className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{brand.name}</h3>
                    <p className="text-gray-500 text-sm">{brand.slug}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    brand.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/brands" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">🏷️</span>
            <span className="text-xs">Brands</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
