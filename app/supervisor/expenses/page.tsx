'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface ExpenseWithDetails {
  id: string
  expense_type: string
  amount: number
  currency: string
  description: string
  receipt_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  tour: {
    name: string
    tour_date: string
  }
  guide: {
    first_name: string
    last_name: string
  }
}

const expenseTypeLabels: Record<string, string> = {
  fuel: '⛽ Fuel',
  parking: '🅿️ Parking',
  toll: '🛣️ Toll',
  meal: '🍽️ Meal',
  maintenance: '🔧 Maintenance',
  supplies: '📦 Supplies',
  other: '📝 Other',
}

export default function SupervisorExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const { data } = await supabase
      .from('expenses')
      .select(`
        id, expense_type, amount, currency, description, receipt_url, status, created_at,
        tour:tour_id (name, tour_date),
        guide:guide_id (first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (data) setExpenses(data as ExpenseWithDetails[])
    setLoading(false)
  }

  async function approveExpense(expenseId: string) {
    setProcessing(expenseId)
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('expenses')
      .update({
        status: 'approved',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
    
    await loadExpenses()
    setProcessing(null)
  }

  async function rejectExpense(expenseId: string, reason: string) {
    setProcessing(expenseId)
    
    await supabase
      .from('expenses')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', expenseId)
    
    await loadExpenses()
    setProcessing(null)
  }

  const pendingExpenses = expenses.filter(e => e.status === 'pending')
  const approvedExpenses = expenses.filter(e => e.status === 'approved')
  const rejectedExpenses = expenses.filter(e => e.status === 'rejected')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/supervisor" className="text-blue-600 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve guide expenses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{pendingExpenses.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approvedExpenses.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{rejectedExpenses.length}</p>
          </div>
        </div>

        {/* Pending Expenses */}
        {pendingExpenses.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Pending Approval</h2>
            <div className="space-y-4">
              {pendingExpenses.map(expense => (
                <div key={expense.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{expenseTypeLabels[expense.expense_type] || expense.expense_type}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${expense.amount.toFixed(2)} {expense.currency}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {expense.tour.name} • {new Date(expense.tour.tour_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        👤 {expense.guide.first_name} {expense.guide.last_name}
                      </p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </div>
                  
                  {expense.description && (
                    <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-lg">
                      {expense.description}
                    </p>
                  )}
                  
                  {expense.receipt_url && (
                    <div className="mb-4">
                      <a 
                        href={expense.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      >
                        📄 View Receipt
                      </a>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveExpense(expense.id)}
                      disabled={processing === expense.id}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {processing === expense.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:')
                        if (reason) rejectExpense(expense.id, reason)
                      }}
                      disabled={processing === expense.id}
                      className="flex-1 bg-red-100 text-red-700 border-2 border-red-200 py-3 rounded-xl font-semibold hover:bg-red-200 transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingExpenses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">✅ All expenses reviewed!</p>
          </div>
        )}
      </div>
    </div>
  )
}
