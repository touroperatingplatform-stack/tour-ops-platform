'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  tour_date: string
  status: string
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  status: string
  has_receipt: boolean
  created_at: string
}

const expenseCategories = [
  { value: 'fuel', label: '⛽ Fuel', icon: '⛽' },
  { value: 'meals', label: '🍽️ Meals', icon: '🍽️' },
  { value: 'supplies', label: '📦 Supplies', icon: '📦' },
  { value: 'parking', label: '🅿️ Parking', icon: '🅿️' },
  { value: 'tolls', label: '🛣️ Tolls', icon: '🛣️' },
  { value: 'other', label: '📝 Other', icon: '📝' },
]

export default function TourExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [loading, setLoading] = useState(true)
  const [tour, setTour] = useState<Tour | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: 'fuel',
    description: '',
    amount: '',
    currency: 'MXN',
    receiptFile: null as File | null,
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [tourId])

  async function loadData() {
    setLoading(true)

    // Load tour
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, tour_date, status')
      .eq('id', tourId)
      .single()

    if (tourData) setTour(tourData)

    // Load expenses
    const { data: expensesData } = await supabase
      .from('tour_expenses')
      .select('*')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: false })

    if (expensesData) setExpenses(expensesData)

    setLoading(false)
  }

  async function handleSubmitExpense() {
    if (!newExpense.amount || !newExpense.description) return

    setUploading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      alert('Please log in')
      return
    }

    // Get company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    let receiptUrl = null

    // Upload receipt if present
    if (newExpense.receiptFile) {
      const fileExt = newExpense.receiptFile.name.split('.').pop()
      const fileName = `${tourId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, newExpense.receiptFile)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)
        receiptUrl = publicUrl
      }
    }

    // Create expense record
    const { error } = await supabase
      .from('tour_expenses')
      .insert({
        tour_id: tourId,
        guide_id: session.user.id,
        company_id: profile?.company_id,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        currency: newExpense.currency,
        receipt_url: receiptUrl,
        has_receipt: !!receiptUrl,
        status: 'pending',
      })

    if (error) {
      alert('Error submitting expense: ' + error.message)
    } else {
      setShowAddModal(false)
      setNewExpense({
        category: 'fuel',
        description: '',
        amount: '',
        currency: 'MXN',
        receiptFile: null,
      })
      loadData()
    }

    setUploading(false)
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const totalExpenses = expenses
    .filter(e => e.status !== 'rejected')
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2"
          >
            ← Back to Tour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Tour Expenses
          </h1>
          <p className="text-gray-500 mt-1">
            {tour?.name} • {tour?.tour_date}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)} MXN</p>
        </div>
      </div>

      {/* Add expense button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <span>+</span>
        Add Expense
      </button>

      {/* Expenses list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-4">📝</p>
            <p>No expenses submitted yet</p>
            <p className="text-sm mt-2">Add your first expense using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => {
              const category = expenseCategories.find(c => c.value === expense.category)
              return (
                <div key={expense.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{category?.icon || '📝'}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {category?.label || expense.category}
                      </p>
                      <p className="text-sm text-gray-500">{expense.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(expense.created_at).toLocaleDateString()}
                        {expense.has_receipt && ' • 📎 Receipt attached'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)} {expense.currency}
                    </p>
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add expense modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="e.g., Lunch at restaurant, Gas station..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={newExpense.currency}
                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* Receipt upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt (optional but recommended)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewExpense({ ...newExpense, receiptFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSubmitExpense}
                  disabled={uploading || !newExpense.amount || !newExpense.description}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Submitting...' : 'Submit Expense'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
