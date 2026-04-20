'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getLocalDate } from '@/lib/timezone'

interface Expense {
  id: string
  guide_name: string
  tour_name: string
  category: string
  description: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  receipt_url: string | null
  created_at: string
}

export default function ExpensesPage() {
  const { t } = useTranslation()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
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

    // Get today's date for stats
    const today = getLocalDate()

    // Load expenses with guide and tour info
    const { data } = await supabase
      .from('tour_expenses')
      .select(`
        id, amount, category, description, currency, receipt_url, status, created_at,
        guide:guide_id (first_name, last_name),
        tour:tour_id (name)
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map((e: any) => ({
        id: e.id,
        guide_name: `${e.guide?.first_name || ''} ${e.guide?.last_name || ''}`.trim() || 'Unknown',
        tour_name: e.tour?.name || 'Unknown',
        amount: e.amount,
        currency: e.currency || 'MXN',
        category: e.category,
        description: e.description,
        status: e.status,
        receipt_url: e.receipt_url,
        created_at: e.created_at
      }))

      setExpenses(formatted)
      
      // Calculate stats from ALL expenses, not sample
      setStats({
        total: formatted.reduce((sum, e) => sum + (e.status === 'approved' ? e.amount : 0), 0),
        today: formatted
          .filter(e => e.created_at?.split('T')[0] === today)
          .reduce((sum, e) => sum + e.amount, 0),
        pending: formatted.filter(e => e.status === 'pending').length
      })
    }

    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('tour_expenses')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setExpenses(expenses.map(e => e.id === id ? { ...e, status: newStatus } : e))
      
      // Update stats
      const expense = expenses.find(e => e.id === id)
      const amount = expense?.amount || 0
      
      setStats(prev => ({
        ...prev,
        total: newStatus === 'approved' 
          ? prev.total + amount
          : prev.total - amount,
        pending: newStatus === 'pending' ? prev.pending + 1 : prev.pending - 1
      }))
    } catch (err: any) {
      alert(t('expenses.errorUpdating') || 'Error updating expense')
    }
  }

  const filteredExpenses = expenses.filter(e => 
    filter === 'all' ? true : e.status === filter
  )

  const categoryMap: Record<string, string> = {
    fuel: t('expenses.categories.fuel'),
    meals: t('expenses.categories.meals'),
    supplies: t('expenses.categories.supplies'),
    parking: t('expenses.categories.parking') || 'Parking',
    tolls: t('expenses.categories.tolls'),
    other: t('expenses.categories.other')
  }

  const categoryIcons: Record<string, string> = {
    fuel: '⛽',
    meals: '🍽️',
    supplies: '📦',
    parking: '🅿️',
    tolls: '🛣️',
    other: '📝'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('expenses.expenseApprovals')}</h1>
            <p className="text-sm text-gray-500">{stats.pending} {t('expenses.pendingApprovals')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">{t('expenses.pending')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">${stats.today.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{t('time.today')}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${stats.total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{t('expenses.approved')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t(`expenses.${f}`)}
            </button>
          ))}
        </div>

        {/* Expenses List */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('expenses.guide')}</th>
                  <th className="px-4 py-3 font-medium">{t('expenses.tour')}</th>
                  <th className="px-4 py-3 font-medium">{t('expenses.category')}</th>
                  <th className="px-4 py-3 font-medium">{t('expenses.amount')}</th>
                  <th className="px-4 py-3 font-medium">{t('expenses.status')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('expenses.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{expense.guide_name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{expense.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{expense.tour_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{categoryIcons[expense.category] || '📝'}</span>
                        <span className="capitalize">{categoryMap[expense.category] || expense.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">${expense.amount.toFixed(2)} {expense.currency}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        expense.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : expense.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t(`expenses.${expense.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {expense.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => updateStatus(expense.id, 'approved')} 
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                            >
                              {t('expenses.approve')}
                            </button>
                            <button 
                              onClick={() => updateStatus(expense.id, 'rejected')} 
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                            >
                              {t('expenses.reject')}
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {t(`expenses.${expense.status}`)}
                          </span>
                        )}
                        {expense.receipt_url && (
                          <a 
                            href={expense.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            {t('expenses.receipt')}
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {t('expenses.noExpensesFound') || 'No expenses found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
