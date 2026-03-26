'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function DataPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importData, setImportData] = useState('')
  const [message, setMessage] = useState('')

  async function exportData() {
    setExporting(true)
    setMessage('')

    try {
      const [
        { data: tours },
        { data: profiles },
        { data: incidents },
        { data: expenses },
        { data: vehicles },
        { data: checkins }
      ] = await Promise.all([
        supabase.from('tours').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('incidents').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('guide_checkins').select('*')
      ])

      const exportObj = {
        exported_at: new Date().toISOString(),
        tours: tours || [],
        profiles: profiles || [],
        incidents: incidents || [],
        expenses: expenses || [],
        vehicles: vehicles || [],
        guide_checkins: checkins || []
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tour-ops-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage(`✅ Exported ${tours?.length || 0} tours, ${profiles?.length || 0} profiles`)
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    }

    setExporting(false)
  }

  async function resetDemoData() {
    setResetting(true)
    setMessage('')

    try {
      // Delete data in order (respecting foreign keys)
      const tables = [
        'guide_checkins',
        'expenses', 
        'incidents',
        'tours',
        'vehicles'
      ]

      let deleted = 0
      let errors: string[] = []

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        
        if (error) {
          errors.push(`${table}: ${error.message}`)
        } else {
          deleted++
        }
      }

      if (errors.length > 0) {
        setMessage(`⚠️ Cleared ${deleted} tables, errors: ${errors.join(', ')}`)
      } else {
        setMessage(`✅ Demo data cleared! Deleted from ${deleted} tables. Users preserved.`)
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    }

    setResetting(false)
    setShowResetConfirm(false)
  }

  async function importDataFn() {
    if (!importData.trim()) {
      setMessage('❌ Please paste JSON data to import')
      return
    }

    setImporting(true)
    setMessage('')

    try {
      const data = JSON.parse(importData)
      
      let imported = 0
      let errors: string[] = []

      if (data.tours?.length > 0) {
        for (const tour of data.tours) {
          const { error } = await supabase
            .from('tours')
            .upsert(tour, { onConflict: 'id' })
          if (error) errors.push(`Tour ${tour.id}: ${error.message}`)
          else imported++
        }
      }

      if (data.incidents?.length > 0) {
        for (const incident of data.incidents) {
          const { error } = await supabase
            .from('incidents')
            .upsert(incident, { onConflict: 'id' })
          if (error) errors.push(`Incident ${incident.id}: ${error.message}`)
          else imported++
        }
      }

      if (data.expenses?.length > 0) {
        for (const expense of data.expenses) {
          const { error } = await supabase
            .from('expenses')
            .upsert(expense, { onConflict: 'id' })
          if (error) errors.push(`Expense ${expense.id}: ${error.message}`)
          else imported++
        }
      }

      if (data.vehicles?.length > 0) {
        for (const vehicle of data.vehicles) {
          const { error } = await supabase
            .from('vehicles')
            .upsert(vehicle, { onConflict: 'id' })
          if (error) errors.push(`Vehicle ${vehicle.id}: ${error.message}`)
          else imported++
        }
      }

      if (data.guide_checkins?.length > 0) {
        for (const checkin of data.guide_checkins) {
          const { error } = await supabase
            .from('guide_checkins')
            .upsert(checkin, { onConflict: 'id' })
          if (error) errors.push(`Checkin ${checkin.id}: ${error.message}`)
          else imported++
        }
      }

      if (errors.length > 0) {
        setMessage(`⚠️ Imported ${imported} items, ${errors.length} errors. First: ${errors[0]}`)
      } else {
        setMessage(`✅ Successfully imported ${imported} items`)
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    }

    setImporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-blue-600 text-sm">← Back</Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>

      {message && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Reset Section */}
      <section className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <h2 className="font-semibold text-red-900 mb-2">🗑️ Reset Demo Data</h2>
        <p className="text-sm text-red-600 mb-4">
          Clear all tours, incidents, expenses, vehicles, and check-ins. <strong>Users are preserved</strong> (required for Supabase auth).
        </p>
        
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
          >
            Reset Demo Data
          </button>
        ) : (
          <div className="bg-red-100 rounded-lg p-4 space-y-3">
            <p className="text-red-800 font-medium">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={resetDemoData}
                disabled={resetting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {resetting ? 'Clearing...' : 'Yes, Clear All Demo Data'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Import Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">📤 Import Demo Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste JSON data to import fresh demo data. Uses upsert (updates existing, creates new).
        </p>
        
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder={`Paste JSON demo data here...`}
          className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm font-mono mb-4"
        />
        
        <button
          onClick={importDataFn}
          disabled={importing}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Data'}
        </button>
      </section>

      {/* Export Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">📥 Export Current Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download all data as JSON for editing or backup.
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </section>

      {/* Instructions */}
      <section className="bg-gray-50 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Workflow</h2>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Click <strong>Reset Demo Data</strong> to clear old data (keeps users)</li>
          <li>Paste updated JSON and click <strong>Import Data</strong></li>
          <li>Done! Fresh demo data is ready</li>
        </ol>
      </section>
    </div>
  )
}
