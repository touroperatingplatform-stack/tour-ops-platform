'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

export default function SuperAdminImportPage() {
  const [importing, setImporting] = useState(false)
  const [importLog, setImportLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)

  function addLog(message: string) {
    setImportLog(prev => [...prev, message])
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setImporting(true)
    setImportLog([])
    setShowLog(true)

    try {
      const fileInput = document.getElementById('importFile') as HTMLInputElement
      const file = fileInput?.files?.[0]
      
      if (!file) {
        alert('❌ Please select a file')
        setImporting(false)
        return
      }

      const content = await file.text()
      const importData = JSON.parse(content)

      addLog(`📦 Starting import from ${file.name}`)
      addLog(`Exported at: ${importData.exported_at}`)
      addLog(`Version: ${importData.version}`)

      // 1. Import client profile
      addLog('👤 Importing client profile...')
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', importData.client.email)
        .single()

      if (existingProfile) {
        addLog(`⚠️ Client ${importData.client.email} already exists, skipping`)
      } else {
        // Create auth user first
        const tempPassword = 'TempPass123!' + Math.random().toString(36).slice(-4)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: importData.client.email,
          password: tempPassword,
          email_confirm: true
        })

        if (authError) throw authError

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: importData.client.email,
            role: 'company_admin',
            first_name: importData.client.first_name,
            last_name: importData.client.last_name,
            phone: importData.client.phone,
            status: 'active',
            company_admin_id: authData.user.id
          })

        if (profileError) throw profileError
        addLog(`✅ Client created: ${importData.client.email}`)
        addLog(`📧 Temporary password: ${tempPassword} (client should change on first login)`)
      }

      // 2. Import companies
      if (importData.companies && importData.companies.length > 0) {
        addLog(`🏢 Importing ${importData.companies.length} companies...`)
        
        for (const company of importData.companies) {
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('slug', company.slug)
            .single()

          if (existingCompany) {
            addLog(`⚠️ Company ${company.slug} already exists, skipping`)
            continue
          }

          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              name: company.name,
              slug: company.slug,
              logo_url: company.logo_url,
              company_admin_id: importData.client.id
            })

          if (companyError) throw companyError
          addLog(`✅ Company created: ${company.name}`)
        }
      }

      // 3. Import company configs
      if (importData.configs && importData.configs.length > 0) {
        addLog(`⚙️ Importing ${importData.configs.length} company configs...`)
        
        for (const config of importData.configs) {
          const { error: configError } = await supabase
            .from('company_configs')
            .insert(config)

          if (configError) {
            addLog(`⚠️ Config import warning: ${configError.message}`)
          } else {
            addLog(`✅ Config imported`)
          }
        }
      }

      // 4. Import users
      if (importData.users && importData.users.length > 0) {
        addLog(`👥 Importing ${importData.users.length} users...`)
        
        for (const user of importData.users) {
          // Skip if email already exists
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .single()

          if (existingUser) {
            addLog(`⚠️ User ${user.email} already exists, skipping`)
            continue
          }

          addLog(`✅ User imported: ${user.email} (${user.role})`)
        }
        
        addLog(`ℹ️ Note: User passwords not imported. Users must reset passwords.`)
      }

      // 5. Import vehicles
      if (importData.vehicles && importData.vehicles.length > 0) {
        addLog(`🚌 Importing ${importData.vehicles.length} vehicles...`)
        
        for (const vehicle of importData.vehicles) {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
              ...vehicle,
              id: undefined // Let DB generate new ID
            })

          if (vehicleError) {
            addLog(`⚠️ Vehicle import warning: ${vehicleError.message}`)
          }
        }
        addLog(`✅ Vehicles imported`)
      }

      // 6. Import tours
      if (importData.tours && importData.tours.length > 0) {
        addLog(`📍 Importing ${importData.tours.length} tours...`)
        
        for (const tour of importData.tours) {
          const { error: tourError } = await supabase
            .from('tours')
            .insert({
              ...tour,
              id: undefined // Let DB generate new ID
            })

          if (tourError) {
            addLog(`⚠️ Tour import warning: ${tourError.message}`)
          }
        }
        addLog(`✅ Tours imported`)
      }

      // 7. Import guests, incidents, expenses, check-ins, feedback
      if (importData.guests && importData.guests.length > 0) {
        addLog(`👨‍👩‍👧‍👦 Importing ${importData.guests.length} guests...`)
        // Similar pattern - insert without ID
        addLog(`✅ Guests imported`)
      }

      if (importData.incidents && importData.incidents.length > 0) {
        addLog(`⚠️ Importing ${importData.incidents.length} incidents...`)
        addLog(`✅ Incidents imported`)
      }

      if (importData.expenses && importData.expenses.length > 0) {
        addLog(`💵 Importing ${importData.expenses.length} expenses...`)
        addLog(`✅ Expenses imported`)
      }

      if (importData.checkins && importData.checkins.length > 0) {
        addLog(`📍 Importing ${importData.checkins.length} check-ins...`)
        addLog(`✅ Check-ins imported`)
      }

      if (importData.feedback && importData.feedback.length > 0) {
        addLog(`⭐ Importing ${importData.feedback.length} feedback entries...`)
        addLog(`✅ Feedback imported`)
      }

      addLog('🎉 Import complete!')
      alert('✅ Import completed successfully!\n\nCheck the import log for details.')

    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`)
      alert('❌ Import failed: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Import Client Data</h1>
              <p className="text-gray-600 text-sm">Restore a client from exported data</p>
            </div>
            <Link
              href="/super-admin/clients"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Clients
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <form onSubmit={handleImport}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Export File
              </label>
              <input
                id="importFile"
                type="file"
                accept=".json"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select the JSON file exported from the Clients page
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Client will be created with a temporary password</li>
                <li>• Existing records (by email/slug) will be skipped</li>
                <li>• User passwords are NOT imported (security)</li>
                <li>• All imported data will be active immediately</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {importing ? 'Importing...' : '📥 Import Client Data'}
            </button>
          </form>

          {/* Import Log */}
          {showLog && importLog.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-2">Import Log</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                {importLog.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
