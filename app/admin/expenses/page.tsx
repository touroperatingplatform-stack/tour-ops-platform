'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  has_receipt: boolean
  receipt_url: string | null
  created_at: string
  guide: {
    first_name: string
    last_name: string
    email: string
  }
  tour: {
    id: string
    name: string
    tour_date: string
  }
}

const expenseCategories: Record<string, string> = {
  fuel: '⛽ Fuel',
  meals: '🍽️ Meals',
  supplies: '📦 Supplies',
  parking: '🅿️ Parking',
  tolls: '🛣️ Tolls',
  other: '📝 Other',
}

export default function AdminExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    loadExpenses()
  }, [filterStatus])

  async function loadExpenses() {
    setLoading(true)

    const query = supabase
      .from('tour_expenses')
      .select(`
        *,
        guide:guide_id (first_name, last_name, email),
        tour:tour_id (id, name, tour_date)
      `)
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
      query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (data) setExpenses(data as Expense[])
    if (error) console.error('Error loading expenses:', error)

    setLoading(false)
  }

  async function approveExpense(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    await supabase
      .from('tour_expenses')
      .update({
        status: 'approved',
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    loadExpenses()
  }

  function openRejectModal(expense: Expense) {
    setSelectedExpense(expense)
    setShowRejectModal(true)
  }

  async function rejectExpense() {
    if (!selectedExpense || !rejectionReason.trim()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    await supabase
      .from('tour_expenses')
      .update({
        status: 'rejected',
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', selectedExpense.id)

    setShowRejectModal(false)
    setRejectionReason('')
    setSelectedExpense(null)
    loadExpenses()
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const totalPending = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalApproved = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tour Expenses</h1>
        <p className="text-gray-500 mt-1">Review and approve guide expense submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">
            ${totalPending.toFixed(2)} MXN
          </p>
          <p className="text-sm text-yellow-600">
            {expenses.filter(e => e.status === 'pending').length} expenses
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Approved (Today)</p>
          <p className="text-2xl font-bold text-green-800">
            ${totalApproved.toFixed(2)} MXN
          </p>
          <p className="text-sm text-green-600">
            {expenses.filter(e => e.status === 'approved').length} expenses
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-800">
            ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} MXN
          </p>
          <p className="text-sm text-gray-600">
            {expenses.length} total
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">📋</p>
            <p>No {filterStatus === 'all' ? '' : filterStatus} expenses</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {expenseCategories[expense.category]?.split(' ')[0] || '📝'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {expenseCategories[expense.category] || expense.category}
                      </p>
                      <p className="text-sm text-gray-600">{expense.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Guide: {expense.guide?.first_name} {expense.guide?.last_name} • {' '}
                        Tour: {expense.tour?.name} ({expense.tour?.tour_date})
                      </p>
                      <p className="text-xs text-gray-400">
                        Submitted: {new Date(expense.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)} {expense.currency}
                    </p>
                    <div className="mt-1">{getStatusBadge(expense.status)}</div>
                    {expense.has_receipt && (
                      <a
                        href={expense.receipt_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        📎 View Receipt
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions for pending */}
                {expense.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => approveExpense(expense.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(expense)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Expense</h2>
            <p className="text-gray-600 mb-4">
              {expenseCategories[selectedExpense.category]} - ${selectedExpense.amount.toFixed(2)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this expense is being rejected..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={rejectExpense}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setSelectedExpense(null)
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
