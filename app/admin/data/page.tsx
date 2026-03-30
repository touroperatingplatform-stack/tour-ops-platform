'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function DataPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function exportData() {
    setLoading(true)
    setMessage('')

    try {
      const [
        { data: tours },
        { data: incidents },
        { data: expenses },
        { data: vehicles },
        { data: checkins }
      ] = await Promise.all([
        supabase.from('tours').select('*'),
        supabase.from('incidents').select('*'),
        supabase.from('tour_expenses').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('guide_checkins').select('*')
      ])

      const exportObj = {
        exported_at: new Date().toISOString(),
        tours: tours || [],
        incidents: incidents || [],
        expenses: expenses || [],
        vehicles: vehicles || [],
        guide_checkins: checkins || []
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setMessage('✅ Export complete!')
    } catch (error) {
      setMessage('❌ Export failed')
    }

    setLoading(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Data Management</h1>
        <p className="text-gray-500 text-sm">Export your data</p>
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 py-2 flex-shrink-0">
          <div className="bg-blue-50 text-blue-700 rounded-lg p-3 text-sm">
            {message}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-3">
          {/* Export */}
          <button
            onClick={exportData}
            disabled={loading}
            className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              📤
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold">Export Data</div>
              <div className="text-gray-500 text-sm">Download all your data</div>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          {/* Import */}
          <Link
            href="/super-admin/import"
            className="block bg-white rounded-xl shadow p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              📥
            </div>
            <div className="flex-1">
              <div className="font-bold">Import Data</div>
              <div className="text-gray-500 text-sm">Restore from backup</div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          {/* Divider */}
          <div className="py-2">
            <div className="border-t" />
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚠️</span>
              <span className="font-bold text-red-700">Danger Zone</span>
            </div>
            <p className="text-red-600 text-sm mb-3">
              Clear all demo data. This cannot be undone.
            </p>
            <Link
              href="/super-admin/demo"
              className="block w-full bg-red-600 text-white text-center py-2 rounded-lg font-medium"
            >
              Clear Demo Data
            </Link>
          </div>
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
          <Link href="/admin/data" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">💾</span>
            <span className="text-xs">Data</span>
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
