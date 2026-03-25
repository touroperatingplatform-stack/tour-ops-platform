'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

const expenseTypes = [
  { value: 'fuel', label: '⛽ Fuel', icon: '⛽' },
  { value: 'parking', label: '🅿️ Parking', icon: '🅿️' },
  { value: 'toll', label: '🛣️ Toll', icon: '🛣️' },
  { value: 'meal', label: '🍽️ Meal/Viaticos', icon: '🍽️' },
  { value: 'maintenance', label: '🔧 Maintenance', icon: '🔧' },
  { value: 'supplies', label: '📦 Supplies', icon: '📦' },
  { value: 'other', label: '📝 Other', icon: '📝' },
]

export default function LogExpensePage() {
  const params = useParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [expenseType, setExpenseType] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  async function handleReceiptUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      if (url) setReceiptUrl(url as string)
    } catch (err) {
      alert('Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!expenseType || !amount) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('expenses')
      .insert({
        tour_id: params.id,
        guide_id: user?.id,
        expense_type: expenseType,
        amount: parseFloat(amount),
        description: description,
        receipt_url: receiptUrl,
        status: 'pending',
        date: new Date().toISOString().split('T')[0], // Today's date
      })

    if (error) {
      alert('Failed to log expense: ' + error.message)
    } else {
      alert('✅ Expense logged! Receipt uploaded for approval.')
      router.push(`/guide/tours/${params.id}`)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 pb-24">
        <div className="mb-6">
          <Link href={`/guide/tours/${params.id}`} className="text-blue-600 text-sm mb-2 inline-block">
            ← Back to tour
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Log Expense</h1>
          <p className="text-gray-500 text-sm mt-1">Record tour expenses for reimbursement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Expense Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {expenseTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setExpenseType(type.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    expenseType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mr-2">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (MXN) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Gas station on highway, Toll booth #3"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Receipt Photo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Receipt Photo <span className="text-red-500">*</span>
            </label>
            
            {receiptUrl ? (
              <div className="relative">
                <img src={receiptUrl} alt="Receipt" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-sm"
                >
                  Retake
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                <span className="text-4xl mb-2">📷</span>
                <span className="text-sm font-medium text-gray-700">Tap to take receipt photo</span>
                <span className="text-xs text-gray-500 mt-1">Required for reimbursement</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploading || !expenseType || !amount || !receiptUrl}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? 'Saving...' : 'Submit Expense for Approval'}
          </button>
        </form>
      </div>
      <div className="h-24"></div>
    </div>
  )
}
