'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  tour_id: string | null
  receipt_url: string | null
  created_by: string | null
}

const categories = ['fuel', 'maintenance', 'supplies', 'tolls', 'meals', 'other']

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (filter !== 'all' && filter !== 'this_month') {
      query = query.eq('category', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading expenses:', error)
    } else {
      const filtered = filter === 'this_month' 
        ? data.filter(e => new Date(e.date).getMonth() === new Date().getMonth())
        : data
      setExpenses(filtered || [])
      setTotal(filtered?.reduce((sum, e) => sum + e.amount, 0) || 0)
    }
    setLoading(false)
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete')
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id))
      loadExpenses()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track operational costs</p>
        </div>
        <Link
          href="/admin/expenses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Expense
        </Link>
      </div>

      {/* Summary */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm">Total Expenses</p>
        <p className="text-4xl font-bold mt-2">${total.toFixed(2)}</p>
        <p className="text-blue-100 text-sm mt-2">{expenses.length} records</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('this_month')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'this_month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap capitalize transition-colors ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No expenses found</p>
            <p className="text-sm">Add your first expense to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium capitalize">
                      {expense.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                    {expense.tour_id && ' • Tour ID: ' + expense.tour_id}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                  <Link
                    href={`/admin/expenses/${expense.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
