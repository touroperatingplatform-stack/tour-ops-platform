'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
}

interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  primary_color: string
}

interface ImportPreview {
  tour_id: string
  tour_name?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  hotel: string
  room_number: string
  adults: number
  children: number
  notes: string
  valid: boolean
  error?: string
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'brands' | 'settings' | 'import' | 'demo'>('companies')
  
  // Import state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [preview, setPreview] = useState<ImportPreview[]>([])
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 })

  // Demo data state
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStats, setDemoStats] = useState({ tours: 0, guests: 0, stops: 0, incidents: 0, expenses: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: companiesData } = await supabase.from('companies').select('*').order('created_at')
    const { data: brandsData } = await supabase.from('brands').select('*').order('created_at')
    
    setCompanies(companiesData || [])
    setBrands(brandsData || [])
    setLoading(false)
  }

  function parseCSV(text: string): ImportPreview[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const requiredHeaders = ['tour_id', 'first_name', 'last_name']
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return [{
        tour_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        hotel: '',
        room_number: '',
        adults: 0,
        children: 0,
        notes: '',
        valid: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      }]
    }

    const previews: ImportPreview[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parse (doesn't handle commas in quoted fields perfectly)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })

      // Validate and parse
      const adults = parseInt(row.adults) || 1
      const children = parseInt(row.children) || 0
      const tourId = row.tour_id || ''

      let valid = true
      let error = undefined

      if (!tourId) {
        valid = false
        error = 'Missing tour_id'
      } else if (!row.first_name?.trim()) {
        valid = false
        error = 'Missing first_name'
      } else if (!row.last_name?.trim()) {
        valid = false
        error = 'Missing last_name'
      } else if (adults < 1) {
        valid = false
        error = 'Adults must be at least 1'
      }

      previews.push({
        tour_id: tourId,
        tour_name: undefined, // Will be loaded later
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone || '',
        hotel: row.hotel || '',
        room_number: row.room_number || '',
        adults,
        children,
        notes: row.notes || row.special_requirements || '',
        valid,
        error
      })
    }

    return previews
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const text = await file.text()
    setCsvData(text)
    const parsed = parseCSV(text)
    setPreview(parsed)
  }

  async function loadTourNames() {
    // Get unique tour IDs from preview
    const tourIds = [...new Set(preview.filter(p => p.valid).map(p => p.tour_id))]
    if (tourIds.length === 0) return

    const { data: tours } = await supabase
      .from('tours')
      .select('id, name')
      .in('id', tourIds)

    if (tours) {
      const tourMap = new Map(tours.map(t => [t.id, t.name]))
      setPreview(prev => prev.map(p => ({
        ...p,
        tour_name: p.tour_id ? tourMap.get(p.tour_id) : undefined
      })))
    }
  }

  useEffect(() => {
    if (preview.length > 0) {
      loadTourNames()
    }
  }, [preview])

  async function handleImport() {
    const validRecords = preview.filter(p => p.valid)
    if (validRecords.length === 0) {
      alert('No valid records to import')
      return
    }

    if (!confirm(`Import ${validRecords.length} guest records? This cannot be undone.`)) {
      return
    }

    setImporting(true)
    let success = 0
    let failed = 0

    for (const record of validRecords) {
      try {
        const { error } = await supabase
          .from('guests')
          .insert({
            tour_id: record.tour_id,
            first_name: record.first_name,
            last_name: record.last_name,
            email: record.email || null,
            phone: record.phone || null,
            hotel: record.hotel || null,
            room_number: record.room_number || null,
            adults: record.adults,
            children: record.children,
            notes: record.notes || null,
            checked_in: false,
            no_show: false,
          })

        if (error) {
          failed++
          console.error('Import failed:', error)
        } else {
          success++
        }
      } catch (err) {
        failed++
        console.error('Import error:', err)
      }
    }

    setImportStats({ success, failed, total: validRecords.length })
    setImporting(false)
    setCsvFile(null)
    setCsvData('')
    setPreview([])
    
    alert(`Import complete!\n✅ Success: ${success}\n❌ Failed: ${failed}`)
  }

  async function handleClearDemoData() {
    if (!confirm('⚠️ DANGER: This will delete ALL demo data!\n\nThis will remove:\n- All guests\n- All guide check-ins\n- All pickup stops\n- All incidents\n- All tour expenses\n- All checklist completions\n\nUsers/auth will be preserved.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)

    try {
      // Delete in order (respecting foreign keys)
      const tables = [
        'guest_feedback',
        'cash_confirmations',
        'payments',
        'checklist_completions',
        'tour_expenses',
        'incident_comments',
        'incidents',
        'guide_checkins',
        'pickup_stops',
        'guests',
        'external_bookings',
      ]

      let deleted = 0
      for (const table of tables) {
        const { data, error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        const recordCount = (data as unknown as any[])?.length || 0
        deleted += recordCount
        if (error) {
          console.error(`Failed to clear ${table}:`, error)
        }
      }

      setDemoStats({ tours: 0, guests: 0, stops: 0, incidents: 0, expenses: 0 })
      alert(`Demo data cleared!\n${deleted} records removed.\nUsers preserved.`)
    } catch (err) {
      console.error('Clear demo data error:', err)
      alert('Error clearing demo data: ' + (err as Error).message)
    } finally {
      setDemoLoading(false)
    }
  }

  async function handleDownloadTemplate() {
    const template = `tour_id,first_name,last_name,email,phone,hotel,room_number,adults,children,notes
TOUR-001,John,Smith,john.smith@email.com,+1-555-0101,Grand Velas Riviera Maya,205,2,0,"Anniversary trip, vegetarian meals"
TOUR-001,Sarah,Johnson,sarah.j@email.com,+1-555-0102,Grand Velas Riviera Maya,205,2,0,"Traveling with John"
TOUR-002,Michael,Brown,m.brown@email.com,+1-555-0103,Beloved Playa Mujeres,312,2,1,"Family with 8yo child, need car seat"
TOUR-002,Lisa,Brown,lisa.b@email.com,+1-555-0104,Beloved Playa Mujeres,312,2,1,"Traveling with Michael"
TOUR-002,Emma,Brown,emma.b@email.com,+1-555-0105,Beloved Playa Mujeres,312,0,1,"Child (8 years old)"
`
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guest-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform configuration and company management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'brands'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Import Data
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'demo'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Demo Management
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Companies</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Company
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {companies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No companies yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Brands</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{company.name}</p>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                              {company.id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">
                                {brands.filter(b => b.company_id === company.id).length} brand(s)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Brands</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Brand
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                          <p className="text-sm text-gray-500">{brand.slug}</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.primary_color }} />
                        <span className="text-sm text-gray-600">{brand.primary_color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Google Drive Integration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID</label>
                        <input
                          type="text"
                          placeholder="Your Google OAuth Client ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client Secret</label>
                        <input
                          type="password"
                          placeholder="Your Google OAuth Client Secret"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Drive Folder ID</label>
                        <input
                          type="text"
                          placeholder="Root folder ID for media storage"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Save Google Drive Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">CSV Import</h2>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    📥 Download Template
                  </button>
                </div>

                {/* Upload Area */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-gray-700 font-medium">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or drag and drop your file here
                      </p>
                    </label>
                  </div>

                  {preview.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Preview ({preview.length} records)
                        </h3>
                        <div className="flex gap-2">
                          <span className="text-sm text-green-600">
                            ✅ {preview.filter(p => p.valid).length} valid
                          </span>
                          <span className="text-sm text-red-600">
                            ❌ {preview.filter(p => !p.valid).length} invalid
                          </span>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Tour</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Guest</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Pax</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Hotel</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {preview.slice(0, 50).map((record, idx) => (
                              <tr key={idx} className={record.valid ? '' : 'bg-red-50'}>
                                <td className="py-2 px-3">
                                  <div className="font-mono text-xs">{record.tour_id}</div>
                                  {record.tour_name && (
                                    <div className="text-xs text-gray-500">{record.tour_name}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {record.first_name} {record.last_name}
                                </td>
                                <td className="py-2 px-3">
                                  {record.adults}A + {record.children}C
                                </td>
                                <td className="py-2 px-3 text-gray-500">
                                  {record.hotel || '-'}
                                </td>
                                <td className="py-2 px-3">
                                  {record.valid ? (
                                    <span className="text-green-600">✓ Valid</span>
                                  ) : (
                                    <span className="text-red-600" title={record.error}>
                                      ✗ {record.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {preview.length > 50 && (
                          <div className="p-3 text-center text-gray-500 text-sm border-t">
                            ...and {preview.length - 50} more records
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => {
                            setCsvFile(null)
                            setCsvData('')
                            setPreview([])
                          }}
                          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleImport}
                          disabled={importing || preview.filter(p => p.valid).length === 0}
                          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                          {importing ? 'Importing...' : `Import ${preview.filter(p => p.valid).length} Records`}
                        </button>
                      </div>

                      {importStats.total > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium">Import Results:</p>
                          <p className="text-green-600">✅ Success: {importStats.success}</p>
                          <p className="text-red-600">❌ Failed: {importStats.failed}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">CSV Format</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Required columns:</strong> tour_id, first_name, last_name</p>
                    <p><strong>Optional columns:</strong> email, phone, hotel, room_number, adults, children, notes</p>
                    <p><strong>Example:</strong></p>
                    <code className="block bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      tour_id,first_name,last_name,email,hotel,adults,children,notes<br/>
                      TOUR-001,John,Smith,john@email.com,Grand Velas,2,0,"Anniversary trip"<br/>
                      TOUR-001,Jane,Smith,jane@email.com,Grand Velas,2,0,"Traveling with John"
                    </code>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'demo' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Demo Management</h2>
                
                {/* Clear Demo Data */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Clear Demo Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Remove all demo data while preserving users and authentication.
                    Use this between demo sessions or when resetting for a new client trial.
                  </p>
                  <button
                    onClick={handleClearDemoData}
                    disabled={demoLoading}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {demoLoading ? 'Clearing...' : '🗑️ Clear All Demo Data'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ This will delete: guests, check-ins, incidents, expenses, pickups, feedback
                  </p>
                </div>

                {/* Demo Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Current Demo Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-xs text-gray-500">Tours</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-xs text-gray-500">Guests</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-xs text-gray-500">Pickups</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-xs text-gray-500">Incidents</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-xs text-gray-500">Expenses</p>
                    </div>
                  </div>
                </div>

                {/* Download Demo Data */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Download Demo Data Template</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Provide this template to prospective clients so they can prepare their data
                    in the correct format before their trial day.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                  >
                    📥 Download Guest Import Template
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
