'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Expense {
  id: string
  guide_name: string
  tour_name: string
  amount: number
  category: string
  description: string
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const { data } = await supabase
      .from('tour_expenses')
      .select(`
        id, amount, category, description, receipt_url, status, created_at,
        guide:guide_id (first_name, last_name),
        tour:tour_id (name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const formatted: Expense[] = data.map((e: any) => ({
        id: e.id,
        guide_name: `${e.guide?.first_name || ''} ${e.guide?.last_name || ''}`.trim() || 'Unknown',
        tour_name: e.tour?.name || 'Unknown',
        amount: e.amount,
        category: e.category,
        description: e.description,
        receipt_url: e.receipt_url,
        status: e.status,
        created_at: e.created_at
      }))
      setExpenses(formatted)
    }
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: 'approved' | 'rejected') {
    await supabase
      .from('tour_expenses')
      .update({ status: newStatus })
      .eq('id', id)
    
    setExpenses(expenses.map(e => 
      e.id === id ? { ...e, status: newStatus } : e
    ))
  }

  const filteredExpenses = expenses.filter(e => 
    filter === 'all' ? true : e.status === filter
  )

  const pendingCount = expenses.filter(e => e.status === 'pending').length

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expense Approvals</h1>
          <p className="text-sm text-gray-500">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
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
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Guide</th>
              <th className="px-4 py-3 font-medium">Tour</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{expense.guide_name}</td>
                <td className="px-4 py-3 text-gray-600">{expense.tour_name}</td>
                <td className="px-4 py-3">
                  <span className="capitalize">{expense.category}</span>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(expense.amount)}</td>
                <td className="px-4 py-3">{getStatusBadge(expense.status)}</td>
                <td className="px-4 py-3 text-right">
                  {expense.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateStatus(expense.id, 'approved')}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(expense.id, 'rejected')}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">{expense.status}</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No {filter !== 'all' ? filter : ''} expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
