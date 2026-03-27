'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface ApiConfig {
  viator_enabled: boolean
  viator_api_key: string
  getyourguide_enabled: boolean
  getyourguide_api_key: string
  tripadvisor_link: string
}

export default function SuperAdminSettingsPage() {
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    viator_enabled: false,
    viator_api_key: '',
    getyourguide_enabled: false,
    getyourguide_api_key: '',
    tripadvisor_link: ''
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadApiConfig()
  }, [])

  async function loadApiConfig() {
    const { data, error } = await supabase.from('api_config').select('*').single()
    if (!error && data) {
      setApiConfig(data)
    }
  }

  async function handleSaveApiConfig() {
    setSavingConfig(true)
    setSaveMessage(null)

    try {
      const { error } = await supabase.from('api_config').upsert({ 
        id: 1,
        ...apiConfig 
      })

      if (error) throw error

      setSaveMessage({ type: 'success', text: '✅ API configuration saved!' })
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: `❌ Error: ${error.message}` })
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          {saveMessage && (
            <div className={`mb-6 p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {saveMessage.text}
            </div>
          )}

          {/* API Configuration */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔌 API Integrations</h2>
            
            <div className="space-y-4">
              {/* Viator */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Viator</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={apiConfig.viator_enabled}
                      onChange={(e) => setApiConfig({ ...apiConfig, viator_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="Viator API Key"
                  value={apiConfig.viator_api_key}
                  onChange={(e) => setApiConfig({ ...apiConfig, viator_api_key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* GetYourGuide */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">GetYourGuide</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={apiConfig.getyourguide_enabled}
                      onChange={(e) => setApiConfig({ ...apiConfig, getyourguide_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="GetYourGuide API Key"
                  value={apiConfig.getyourguide_api_key}
                  onChange={(e) => setApiConfig({ ...apiConfig, getyourguide_api_key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* TripAdvisor */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">TripAdvisor</h3>
                <input
                  type="text"
                  placeholder="TripAdvisor Review Link"
                  value={apiConfig.tripadvisor_link}
                  onChange={(e) => setApiConfig({ ...apiConfig, tripadvisor_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSaveApiConfig}
              disabled={savingConfig}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {savingConfig ? 'Saving...' : 'Save API Configuration'}
            </button>
          </div>

          {/* Google Drive */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📁 Google Drive Integration</h2>
            
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
            </div>

            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
              Save Google Drive Settings
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
