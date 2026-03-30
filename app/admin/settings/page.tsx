'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

interface CompanySettings {
  company_name: string
  timezone: string
  currency: string
  language: string
}

interface UserPreferences {
  notifications: boolean
  auto_dispatch: boolean
  require_checklist: boolean
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: 'Tour Ops Platform',
    timezone: 'America/Cancun',
    currency: 'USD',
    language: 'English'
  })
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    auto_dispatch: false,
    require_checklist: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    
    // Load company settings
    const { data: companyData } = await supabase
      .from('companies')
      .select('name, timezone, currency, language')
      .single()
    
    if (companyData) {
      setCompanySettings({
        company_name: companyData.name || 'Tour Ops Platform',
        timezone: companyData.timezone || 'America/Cancun',
        currency: companyData.currency || 'USD',
        language: companyData.language || 'English'
      })
    }

    // Load user preferences
    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('notifications, auto_dispatch, require_checklist')
      .eq('user_id', user?.id)
      .single()
    
    if (prefData) {
      setPreferences({
        notifications: prefData.notifications ?? true,
        auto_dispatch: prefData.auto_dispatch ?? false,
        require_checklist: prefData.require_checklist ?? true
      })
    }
    
    setLoading(false)
  }

  async function saveCompanySettings() {
    setSaving(true)
    setMessage('')
    
    const { error } = await supabase
      .from('companies')
      .update({
        name: companySettings.company_name,
        timezone: companySettings.timezone,
        currency: companySettings.currency,
        language: companySettings.language
      })
      .eq('id', user?.company_id)
    
    if (error) {
      setMessage('❌ Error saving settings')
    } else {
      setMessage('✅ Settings saved!')
    }
    
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function togglePreference(key: keyof UserPreferences) {
    const newValue = !preferences[key]
    setPreferences(prev => ({ ...prev, [key]: newValue }))
    
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user?.id,
        [key]: newValue
      })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Settings</h1>
            <p className="text-gray-500 text-sm">Configure your account</p>
          </div>
          {message && (
            <span className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        
        {/* Profile Section */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <div className="font-bold">{user?.email?.split('@')[0] || 'Admin'}</div>
              <div className="text-gray-500 text-sm">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Company Settings */}
        <div className="mb-4">
          <h2 className="text-gray-500 text-xs font-semibold uppercase mb-2">Company</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <label className="text-xs text-gray-500 uppercase">Company Name</label>
              <input
                type="text"
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="px-4 py-3 border-b">
              <label className="text-xs text-gray-500 uppercase">Timezone</label>
              <select
                value={companySettings.timezone}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/Cancun">America/Cancun (EST)</option>
                <option value="America/Mexico_City">America/Mexico City (CST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="America/New_York">America/New York (EST)</option>
              </select>
            </div>
            
            <div className="px-4 py-3 border-b">
              <label className="text-xs text-gray-500 uppercase">Currency</label>
              <select
                value={companySettings.currency}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            
            <div className="px-4 py-3">
              <label className="text-xs text-gray-500 uppercase">Language</label>
              <select
                value={companySettings.language}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={saveCompanySettings}
            disabled={saving}
            className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Company Settings'}
          </button>
        </div>

        {/* Preferences */}
        <div className="mb-4">
          <h2 className="text-gray-500 text-xs font-semibold uppercase mb-2">Preferences</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-gray-500 text-xs">Get alerts for incidents</div>
                </div>
              </div>
              <button
                onClick={() => togglePreference('notifications')}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  preferences.notifications ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  preferences.notifications ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
            
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="font-medium">Auto Dispatch</div>
                  <div className="text-gray-500 text-xs">Auto-assign guides to tours</div>
                </div>
              </div>
              <button
                onClick={() => togglePreference('auto_dispatch')}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  preferences.auto_dispatch ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  preferences.auto_dispatch ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
            
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">✓</span>
                <div>
                  <div className="font-medium">Require Checklist</div>
                  <div className="text-gray-500 text-xs">Mandatory tour checklists</div>
                </div>
              </div>
              <button
                onClick={() => togglePreference('require_checklist')}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  preferences.require_checklist ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  preferences.require_checklist ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mb-6">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
