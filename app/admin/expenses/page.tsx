'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

const categoryIcons: Record<string, string> = {
  fuel: '⛽',
  maintenance: '🔧',
  supplies: '📦',
  tolls: '🛍️',
  meals: '🍽️',
  other: '📝'
}

export default function ExpensesPage() {
  const { t } = useTranslation()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState({ total: 0, today: 0, week: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const today = getLocalDate()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data } = await supabase
      .from('tour_expenses')
      .select('id, amount, category, description, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const formatted = data.map((e: any) => ({
        ...e,
        date: e.created_at?.split('T')[0]
      }))

      setExpenses(formatted)
      setStats({
        total: formatted.reduce((sum: number, e: Expense) => sum + e.amount, 0),
        today: formatted.filter((e: Expense) => e.date === today).reduce((sum: number, e: Expense) => sum + e.amount, 0),
        week: formatted.filter((e: Expense) => e.date >= weekAgo).reduce((sum: number, e: Expense) => sum + e.amount, 0)
      })
    }
    setLoading(false)
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
              <h1 className="text-xl font-bold">{t('nav.expenses')}</h1>
              <p className="text-gray-500 text-sm">{t('expenses.trackCosts')}</p>
            </div>
            <Link 
              href="/admin/expenses/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + {t('common.add')}
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0 border-8 border-transparent">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">${stats.today}</div>
            <div className="text-gray-500 text-xs">{t('time.today')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">${stats.week}</div>
            <div className="text-gray-500 text-xs">{t('time.thisWeek')}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">${stats.total}</div>
            <div className="text-gray-500 text-xs">{t('common.total')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                {t('expenses.noExpenses')}
              </div>
            ) : (
              expenses.map(expense => (
                <Link
                  key={expense.id}
                  href={`/admin/expenses/${expense.id}`}
                  className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                        {categoryIcons[expense.category] || '📝'}
                      </div>
                      <div>
                        <h3 className="font-bold capitalize">{t(`expenses.categories.${expense.category}`, expense.category)}</h3>
                        <p className="text-gray-500 text-sm">{expense.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${expense.amount}</div>
                      <div className="text-gray-400 text-xs">{expense.date}</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <Link href="/admin" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">🚌</span>
            <span className="text-xs">{t('nav.tours')}</span>
          </Link>
          <Link href="/admin/expenses" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-blue-600">
            <span className="text-xl mb-1">💰</span>
            <span className="text-xs">{t('nav.expenses')}</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500">
            <span className="text-xl mb-1">⚙️</span>
            <span className="text-xs">{t('profile.settings')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}