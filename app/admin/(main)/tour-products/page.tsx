'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { normalizeServiceCode } from '@/lib/tour-products'

interface TourProduct {
  id: string
  service_code: string
  name: string
  description: string | null
  duration_minutes: number
  activity_count: number
  requires_guide: boolean
  requires_driver: boolean
  max_guests: number
  is_active: boolean
  created_at: string
}

export default function TourProductsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [products, setProducts] = useState<TourProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [filter])

  async function loadProducts() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('tour_products')
      .select('id, service_code, name, description, duration_minutes, activity_ids, requires_guide, requires_driver, max_guests, is_active, created_at')
      .eq('company_id', profile.company_id)

    if (filter === 'active') {
      query = query.eq('is_active', true)
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query.order('name')

    if (data) {
      const formatted = data.map((p: any) => ({
        ...p,
        activity_count: p.activity_ids?.length || 0
      }))
      setProducts(formatted)
    } else if (error) {
      console.error('Error loading products:', error)
    }

    setLoading(false)
  }

  async function handleDeactivate(productId: string) {
    if (!confirm(t('tourProducts.confirmDeactivate') || 'Deactivate this product? It will no longer be available for new tours.')) {
      return
    }

    setDeleting(productId)
    const { error } = await supabase
      .from('tour_products')
      .update({ is_active: false })
      .eq('id', productId)

    if (!error) {
      loadProducts()
    }
    setDeleting(null)
  }

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(query) ||
      p.service_code.toLowerCase().includes(query)
    )
  })

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('tourProducts.title') || 'Tour Products'}</h1>
              <p className="text-gray-500 text-sm">
                {t('tourProducts.subtitle') || 'Reusable tour templates'}
              </p>
            </div>
            <Link
              href="/admin/tour-products/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + {t('common.add') || 'Add'}
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="flex gap-3 mb-3">
          {(['active', 'inactive', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'active' && (t('tourProducts.active') || 'Active')}
              {f === 'inactive' && (t('tourProducts.inactive') || 'Inactive')}
              {f === 'all' && (t('common.all') || 'All')}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('tourProducts.searchPlaceholder') || 'Search products...'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
        />
      </div>

      {/* Products List */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? (t('tourProducts.noSearchResults') || 'No products match your search')
                  : (t('tourProducts.noProducts') || 'No tour products yet. Create your first product to get started.')
                }
              </p>
              {!searchQuery && (
                <Link
                  href="/admin/tour-products/new"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {t('tourProducts.createFirst') || 'Create First Product'}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${
                    product.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🎫</span>
                        <h3 className="font-bold text-lg">{product.name}</h3>
                        {!product.is_active && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                            {t('common.inactive') || 'Inactive'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{product.service_code}</span>
                        <span>•</span>
                        <span>⏱️ {formatDuration(product.duration_minutes)}</span>
                        <span>•</span>
                        <span>🎯 {product.activity_count} {t('tourProducts.activities') || 'activities'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.requires_guide && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        👤 {t('tourProducts.requiresGuide') || 'Requires Guide'}
                      </span>
                    )}
                    {product.requires_driver && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        🚐 {t('tourProducts.requiresDriver') || 'Requires Driver'}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      👥 {t('tourProducts.maxGuests') || 'Max'} {product.max_guests}
                    </span>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tour-products/${product.id}`}
                      className="flex-1 py-2 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium text-center hover:bg-blue-100"
                    >
                      {t('common.edit') || 'Edit'}
                    </Link>
                    {product.is_active && (
                      <button
                        onClick={() => handleDeactivate(product.id)}
                        disabled={deleting === product.id}
                        className="py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                      >
                        {deleting === product.id ? '...' : (t('common.deactivate') || 'Deactivate')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
