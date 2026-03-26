'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function DataPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importData, setImportData] = useState('')
  const [message, setMessage] = useState('')

  async function exportData() {
    setExporting(true)
    setMessage('')

    try {
      // Get all data
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

      // Download as JSON
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

      // Import tours
      if (data.tours?.length > 0) {
        for (const tour of data.tours) {
          const { error } = await supabase
            .from('tours')
            .upsert(tour, { onConflict: 'id' })
          if (error) errors.push(`Tour ${tour.id}: ${error.message}`)
          else imported++
        }
      }

      // Import incidents
      if (data.incidents?.length > 0) {
        for (const incident of data.incidents) {
          const { error } = await supabase
            .from('incidents')
            .upsert(incident, { onConflict: 'id' })
          if (error) errors.push(`Incident ${incident.id}: ${error.message}`)
          else imported++
        }
      }

      // Import expenses
      if (data.expenses?.length > 0) {
        for (const expense of data.expenses) {
          const { error } = await supabase
            .from('expenses')
            .upsert(expense, { onConflict: 'id' })
          if (error) errors.push(`Expense ${expense.id}: ${error.message}`)
          else imported++
        }
      }

      // Import guide_checkins
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
        setMessage(`⚠️ Imported ${imported} items, ${errors.length} errors. First error: ${errors[0]}`)
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-blue-600 text-sm">← Back</Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900">Data Export / Import</h1>

      {message && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Export Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">📥 Export Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download all data as JSON. You can edit dates and re-import.
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </section>

      {/* Import Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">📤 Import Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste JSON data to import. Uses upsert (updates existing, creates new).
        </p>
        
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder={`Paste JSON here, e.g.:
{
  "tours": [...],
  "incidents": [...]
}`}
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

      {/* Instructions */}
      <section className="bg-gray-50 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">How to use</h2>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Click "Export All Data" to download current data</li>
          <li>Open the JSON file in a text editor</li>
          <li>Update dates (change tour_date to today)</li>
          <li>Copy the JSON and paste it above</li>
          <li>Click "Import Data" to update the database</li>
        </ol>
      </section>
    </div>
  )
}
