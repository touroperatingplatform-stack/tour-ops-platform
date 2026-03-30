'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'

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
  tolls: '🛣️',
  meals: '🍽️',
  other: '📝'
}

export default function ExpensesPage() {
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
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Expenses</h1>
            <p className="text-gray-500 text-sm">Track costs</p>
          </div>
          <Link 
            href="/admin/expenses/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">${stats.today}</div>
            <div className="text-gray-500 text-xs">Today</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">${stats.week}</div>
            <div className="text-gray-500 text-xs">This Week</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">${stats.total}</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              No expenses yet
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
                      <h3 className="font-bold capitalize">{expense.category}</h3>
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
          <Link href="/admin/expenses" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">💰</span>
            <span className="text-xs">Expenses</span>
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
