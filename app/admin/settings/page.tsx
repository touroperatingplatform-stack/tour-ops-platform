'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    company_name: '',
    timezone: 'America/Cancun',
    currency: 'USD',
    notification_email: '',
    auto_dispatch: false,
    require_checklist: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    // In production, load from settings table
    // For now, use defaults
    setSettings({
      company_name: 'Tour Ops Platform',
      timezone: 'America/Cancun',
      currency: 'USD',
      notification_email: '',
      auto_dispatch: false,
      require_checklist: true,
    })
  }

  function handleChange(field: string, value: string | boolean) {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Save to settings table
    // await supabase.from('settings').upsert(settings)
    
    alert('Settings saved!')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure system preferences</p>
      </div>

      {/* Company Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Company</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/Cancun">Cancun (EST)</option>
                <option value="America/Mexico_City">Mexico City (CST)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="America/Chicago">Chicago (CST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
            <input
              type="email"
              value={settings.notification_email}
              onChange={(e) => handleChange('notification_email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="alerts@company.com"
            />
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Operations</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto Dispatch</p>
              <p className="text-sm text-gray-500">Automatically assign guides to tours</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('auto_dispatch', !settings.auto_dispatch)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.auto_dispatch ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.auto_dispatch ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Require Checklist</p>
              <p className="text-sm text-gray-500">Guides must complete checklist before starting</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('require_checklist', !settings.require_checklist)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.require_checklist ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.require_checklist ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
