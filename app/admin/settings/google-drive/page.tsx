'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function GoogleDriveSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
    refresh_token: '',
    folder_id: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) {
      alert('Company not found')
      setLoading(false)
      return
    }

    // Upsert config
    const { error } = await supabase
      .from('company_configs')
      .upsert({
        company_id: profile.company_id,
        config_key: 'google_drive',
        config_value: formData,
      })

    setLoading(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Failed to save: ' + error.message)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Drive Integration</h1>
      <p className="text-gray-500 mb-6">Configure Google Drive for photo storage</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="underline text-blue-600">Google Cloud Console</a></li>
          <li>Create a new project or select existing</li>
          <li>Enable Google Drive API</li>
          <li>Go to Credentials → Create OAuth Client ID (Desktop app)</li>
          <li>Copy Client ID and Client Secret below</li>
          <li>Run OAuth flow to get refresh token (use <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline text-blue-600">OAuth Playground</a>)</li>
          <li>Create a Google Drive folder and copy its ID</li>
          <li>Share the folder with your Google account</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl space-y-4">
        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ Settings saved successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID *
          </label>
          <input
            type="text"
            required
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123456789-abc123def456.apps.googleusercontent.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret *
          </label>
          <input
            type="password"
            required
            value={formData.client_secret}
            onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="GOCSPX-..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refresh Token *
          </label>
          <input
            type="password"
            required
            value={formData.refresh_token}
            onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1//04..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline">OAuth Playground</a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Drive Folder ID *
          </label>
          <input
            type="text"
            required
            value={formData.folder_id}
            onChange={(e) => setFormData({ ...formData, folder_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1a2b3c4d5e6f7g8h9i0j"
          />
          <p className="text-xs text-gray-500 mt-1">
            The ID from the URL: drive.google.com/drive/folders/<strong>THIS_PART</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
