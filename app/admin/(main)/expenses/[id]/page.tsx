'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'other',
    description: '',
    date: '',
    tour_id: '',
    receipt_url: '',
  })

  const categories = [
    { value: 'fuel', label: t('expenses.categories.fuel'), icon: '⛽' },
    { value: 'maintenance', label: t('expenses.categories.maintenance'), icon: '🔧' },
    { value: 'supplies', label: t('expenses.categories.supplies'), icon: '📦' },
    { value: 'tolls', label: t('expenses.categories.tolls'), icon: '🛣️' },
    { value: 'meals', label: t('expenses.categories.meals'), icon: '🍽️' },
    { value: 'other', label: t('expenses.categories.other'), icon: '📝' },
  ]

  useEffect(() => {
    loadExpense()
  }, [])

  async function loadExpense() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      alert('Failed to load expense')
      router.push('/admin/expenses')
    } else if (data) {
      setFormData({
        amount: data.amount.toString(),
        category: data.category,
        description: data.description,
        date: data.date,
        tour_id: data.tour_id || '',
        receipt_url: data.receipt_url || '',
      })
    }
    setLoading(false)
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          tour_id: formData.tour_id || null,
          receipt_url: formData.receipt_url || null,
        })
        .eq('id', params.id)

      if (error) throw error

      router.push('/admin/expenses')
    } catch (err: any) {
      alert(err.message || 'Failed to update expense')
    } finally {
      setSaving(false)
    }
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
          <div className="px-4 py-3">
            <Link href="/admin/expenses" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('expenses.backToExpenses')}
            </Link>
            <h1 className="text-xl font-bold">{t('expenses.editExpense')}</h1>
            <p className="text-gray-500 text-sm">{t('expenses.updateDetails')}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <form onSubmit={handleSubmit} className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-md mx-auto space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.amount')} *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.category')} *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleChange('category', cat.value)}
                    className={`px-4 py-3 rounded-lg border-2 text-center transition-all ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.description')} *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('expenses.descriptionPlaceholder')}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.date')} *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tour ID (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.relatedTour')}</label>
              <input
                type="text"
                value={formData.tour_id}
                onChange={(e) => handleChange('tour_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('expenses.relatedTourOptional')}
              />
            </div>

            {/* Receipt URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expenses.receiptUrl')}</label>
              <input
                type="url"
                value={formData.receipt_url}
                onChange={(e) => handleChange('receipt_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/admin/expenses"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? t('expenses.saving') : t('expenses.saveChanges')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}