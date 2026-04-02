'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

export default function ImportPage() {
  const [importing, setImporting] = useState(false)
  const [importLog, setImportLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setImporting(true)
    setImportLog([])
    setShowLog(true)

    const form = e.currentTarget
    const fileInput = form.elements.namedItem('importFile') as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      setImportLog(['❌ No file selected'])
      setImporting(false)
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      setImportLog([`📁 Loaded file: ${file.name}`])

      // Import companies
      if (data.companies && data.companies.length > 0) {
        setImportLog(prev => [...prev, `🏢 Importing ${data.companies.length} companies...`])
        
        for (const company of data.companies) {
          const { error } = await supabase
            .from('companies')
            .upsert({
              id: company.id,
              name: company.name,
              slug: company.slug,
              logo_url: company.logo_url || null,
              status: company.status || 'active',
              created_at: company.created_at
            }, { onConflict: 'slug' })

          if (error) {
            setImportLog(prev => [...prev, `⚠️ Company ${company.name}: ${error.message}`])
          }
        }
        setImportLog(prev => [...prev, `✅ Companies imported`])
      }

      // Import profiles
      if (data.users && data.users.length > 0) {
        setImportLog(prev => [...prev, `👤 Importing ${data.users.length} users...`])
        
        for (const user of data.users) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.full_name || null,
              first_name: user.first_name || null,
              last_name: user.last_name || null,
              phone: user.phone || null,
              role: user.role || 'guide',
              status: user.status || 'active',
              company_id: user.company_id || null,
              created_at: user.created_at
            }, { onConflict: 'email' })

          if (error) {
            setImportLog(prev => [...prev, `⚠️ User ${user.email}: ${error.message}`])
          }
        }
        setImportLog(prev => [...prev, `✅ Users imported`])
      }

      setImportLog(prev => [...prev, `🎉 Import complete!`])
      form.reset()

    } catch (err: any) {
      setImportLog(prev => [...prev, `❌ Error: ${err.message}`])
    } finally {
      setImporting(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Import Client Data</h1>
              </div>
              <div className="border-8 border-transparent">
                <Link
                  href="/super-admin/clients"
                  className="border-8 border-transparent text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Clients
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-none">
            <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
              <form onSubmit={handleImport}>
                <div className="border-8 border-transparent">
                  <div className="border-8 border-transparent mb-6">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Select Export File
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-2">
                      <input
                        name="importFile"
                        type="file"
                        accept=".json"
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div className="border-8 border-transparent">
                      <p className="text-xs text-gray-500 mt-1">
                        Select the JSON file exported from the Clients page
                      </p>
                    </div>
                  </div>

                  <div className="border-8 border-transparent mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="border-8 border-transparent">
                      <h3 className="border-8 border-transparent font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h3>
                    </div>
                    <div className="border-8 border-transparent">
                      <ul className="border-8 border-transparent text-sm text-yellow-700 space-y-1">
                        <li className="border-8 border-transparent">• Client will be created with a temporary password</li>
                        <li className="border-8 border-transparent">• Existing records (by email/slug) will be skipped</li>
                        <li className="border-8 border-transparent">• User passwords are NOT imported (security)</li>
                        <li className="border-8 border-transparent">• All imported data will be active immediately</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-8 border-transparent">
                    <button
                      type="submit"
                      disabled={importing}
                      className="border-8 border-transparent w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                    >
                      {importing ? 'Importing...' : '📥 Import Client Data'}
                    </button>
                  </div>
                </div>
              </form>

              {showLog && importLog.length > 0 && (
                <div className="border-8 border-transparent mt-6">
                  <div className="border-8 border-transparent">
                    <h3 className="border-8 border-transparent font-medium text-gray-700 mb-2">Import Log</h3>
                  </div>
                  <div className="border-8 border-transparent bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                    {importLog.map((log, i) => (
                      <div key={i} className="border-8 border-transparent mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
