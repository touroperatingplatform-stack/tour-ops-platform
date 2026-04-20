'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface CompanySettings {
  name: string
  timezone: string
  currency: string
  language: string
}

interface DriveSettings {
  client_id: string
  client_secret: string
  refresh_token: string
  folder_id: string
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  const [company, setCompany] = useState<CompanySettings>({
    name: '',
    timezone: 'America/Cancun',
    currency: 'USD',
    language: 'en'
  })
  
  const [drive, setDrive] = useState<DriveSettings>({
    client_id: '',
    client_secret: '',
    refresh_token: '',
    folder_id: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        setLoading(false)
        return
      }

      setCompanyId(profile.company_id)

      // Load company settings
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, timezone, currency, language')
        .eq('id', profile.company_id)
        .single()

      if (companyData) {
        setCompany({
          name: companyData.name || '',
          timezone: companyData.timezone || 'America/Cancun',
          currency: companyData.currency || 'USD',
          language: companyData.language || 'en'
        })
      }

      // Load drive settings
      const { data: driveData } = await supabase
        .from('company_settings')
        .select('drive_client_id, drive_client_secret, drive_refresh_token, drive_folder_id')
        .eq('company_id', profile.company_id)
        .single()

      if (driveData) {
        setDrive({
          client_id: driveData.drive_client_id || '',
          client_secret: driveData.drive_client_secret || '',
          refresh_token: driveData.drive_refresh_token || '',
          folder_id: driveData.drive_folder_id || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveCompany() {
    if (!companyId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        timezone: company.timezone,
        currency: company.currency,
        language: company.language
      })
      .eq('id', companyId)

    if (error) {
      setMessage(t('settings.saveError'))
    } else {
      setMessage(t('settings.savedSuccess'))
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function saveDrive() {
    if (!companyId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        drive_client_id: drive.client_id,
        drive_client_secret: drive.client_secret,
        drive_refresh_token: drive.refresh_token,
        drive_folder_id: drive.folder_id
      })

    if (error) {
      setMessage(t('settings.saveError'))
    } else {
      setMessage(t('settings.savedSuccess'))
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center border-8 border-transparent">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full border-8 border-transparent overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.settings')}</h1>
            <p className="text-sm text-gray-500">{t('settings.subtitle')}</p>
          </div>
          {message && (
            <span className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </span>
          )}
        </div>

        {/* Company Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.company')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.companyName')}</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.timezone')}</label>
              <select
                value={company.timezone}
                onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="America/Cancun">America/Cancun (EST)</option>
                <option value="America/Mexico_City">America/Mexico City (CST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="America/New_York">America/New York (EST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.currency')}</label>
              <select
                value={company.currency}
                onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.language')}</label>
              <select
                value={company.language}
                onChange={(e) => setCompany({ ...company, language: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveCompany}
            disabled={saving}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('settings.saving') : t('settings.saveCompany')}
          </button>
        </div>

        {/* Google Drive Integration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.googleDrive')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('settings.googleDriveDesc')}</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.clientId')}</label>
                <input
                  type="text"
                  value={drive.client_id}
                  onChange={(e) => setDrive({ ...drive, client_id: e.target.value })}
                  placeholder="your-client-id.apps.googleusercontent.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.clientSecret')}</label>
                <input
                  type="password"
                  value={drive.client_secret}
                  onChange={(e) => setDrive({ ...drive, client_secret: e.target.value })}
                  placeholder="GOCSPX-..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.refreshToken')}</label>
              <input
                type="text"
                value={drive.refresh_token}
                onChange={(e) => setDrive({ ...drive, refresh_token: e.target.value })}
                placeholder="1//..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.folderId')}</label>
              <input
                type="text"
                value={drive.folder_id}
                onChange={(e) => setDrive({ ...drive, folder_id: e.target.value })}
                placeholder="1A2B3C..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{t('settings.folderIdHint')}</p>
            </div>
          </div>
          <button
            onClick={saveDrive}
            disabled={saving}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('settings.saving') : t('settings.saveSettings')}
          </button>
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.title')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('auth.signOut')}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
