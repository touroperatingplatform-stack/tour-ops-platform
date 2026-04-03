'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function GoogleDriveSettingsPage() {
  const { t } = useTranslation()
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="px-4 py-3">
            <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('settings.backToSettings')}
            </Link>
            <h1 className="text-xl font-bold">{t('settings.googleDrive')}</h1>
            <p className="text-gray-500 text-sm">{t('settings.googleDriveDesc')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="h-full overflow-auto px-4 py-4 border-8 border-transparent">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t('settings.setupInstructions')}:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>{t('settings.instruction1')} <a href="https://console.cloud.google.com" target="_blank" className="underline text-blue-600">Google Cloud Console</a></li>
                <li>{t('settings.instruction2')}</li>
                <li>{t('settings.instruction3')}</li>
                <li>{t('settings.instruction4')}</li>
                <li>{t('settings.instruction5')}</li>
                <li>{t('settings.instruction6')} <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline text-blue-600">OAuth Playground</a></li>
                <li>{t('settings.instruction7')}</li>
                <li>{t('settings.instruction8')}</li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              {saved && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  ✓ {t('settings.savedSuccess')}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.clientId')} *
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
                  {t('settings.clientSecret')} *
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
                  {t('settings.refreshToken')} *
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
                  {t('settings.getTokenFrom')} <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline">OAuth Playground</a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.folderId')} *
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
                  {t('settings.folderIdHint')}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('settings.saving') : t('settings.saveSettings')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}