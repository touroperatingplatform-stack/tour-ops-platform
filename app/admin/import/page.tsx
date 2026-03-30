'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [partnerId, setPartnerId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{success?: number, total?: number, errors?: string[]} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', 'placeholder') // Will be set server-side from auth
    if (partnerId) formData.append('partner_id', partnerId)

    try {
      const response = await fetch('/api/admin/import/csv', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: data.imported,
          total: data.total,
          errors: data.errors
        })
      } else {
        setResult({
          success: 0,
          total: 0,
          errors: [data.error || 'Upload failed']
        })
      }
    } catch (error) {
      setResult({
        success: 0,
        total: 0,
        errors: ['Network error']
      })
    }

    setUploading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected)
      setResult(null)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Import Bookings</h1>
        <p className="text-gray-500 text-sm">Upload CSV from Viator, GetYourGuide, etc.</p>
      </div>

      {/* Upload Area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        
        {/* Partner Selection */}
        <div className="mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">
            Booking Partner (optional)
          </label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Generic / Unknown</option>
            <option value="viator">Viator</option>
            <option value="getyourguide">GetYourGuide</option>
            <option value="hotel">Hotel Direct</option>
          </select>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="text-gray-500 text-xs font-semibold uppercase mb-2 block">
            CSV File
          </label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
          >
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">📁</p>
                <p className="font-medium">Click to select CSV file</p>
                <p className="text-gray-500 text-sm">Supports Viator, GetYourGuide exports</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Expected Columns */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <h3 className="font-medium mb-2">Expected CSV Columns:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>tour_name</strong> or <strong>product</strong> - Tour name</p>
            <p>• <strong>date</strong> or <strong>tour_date</strong> - Tour date (YYYY-MM-DD)</p>
            <p>• <strong>first_name</strong>, <strong>last_name</strong> - Guest name</p>
            <p>• <strong>adults</strong>, <strong>children</strong> - Number of guests</p>
            <p>• <strong>hotel</strong>, <strong>room_number</strong> - Pickup location</p>
            <p>• <strong>email</strong>, <strong>phone</strong> - Contact info</p>
            <p>• <strong>reference</strong> or <strong>booking_id</strong> - Booking reference</p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Import Bookings'}
        </button>

        {/* Results */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.errors?.length ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="font-medium">
              {result.success} of {result.total} bookings imported
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-medium">Errors:</p>
                <ul className="text-sm text-red-600 mt-1 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... and {result.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
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
          <Link href="/admin/import" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">📥</span>
            <span className="text-xs">Import</span>
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
