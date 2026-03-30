'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface PlatformSettings {
  platform_name: string
  default_timezone: string
  default_currency: string
  enable_multi_company: boolean
  enable_external_bookings: boolean
  require_guide_checkins: boolean
  require_driver_checkins: boolean
  default_guests_per_tour: number
  max_tours_per_day: number
  incident_escalation_enabled: boolean
  expense_approval_required: boolean
  enable_guest_feedback: boolean
  enable_activity_feed: boolean
  maintenance_mode: boolean
  maintenance_message: string
}

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'Tour Operations Platform',
    default_timezone: 'America/Cancun',
    default_currency: 'MXN',
    enable_multi_company: true,
    enable_external_bookings: true,
    require_guide_checkins: true,
    require_driver_checkins: true,
    default_guests_per_tour: 8,
    max_tours_per_day: 100,
    incident_escalation_enabled: true,
    expense_approval_required: true,
    enable_guest_feedback: true,
    enable_activity_feed: true,
    maintenance_mode: false,
    maintenance_message: 'Platform is under maintenance. Please check back later.'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      // Try to load from platform_settings table
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({ ...settings, ...data })
      }
    } catch (error) {
      console.log('No platform settings found, using defaults')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Upsert settings
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1, // Single row for platform settings
          ...settings,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      alert('✅ Settings saved successfully!')
    } catch (error: any) {
      alert('❌ Error saving settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  function updateSetting<K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <RoleGuard requiredRole='super_admin'>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading settings...</div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Platform Settings</h1>
              <p className="text-gray-600 text-sm">Configure platform-wide defaults and settings</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name}
                  onChange={(e) => updateSetting('platform_name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Timezone
                </label>
                <select
                  value={settings.default_timezone}
                  onChange={(e) => updateSetting('default_timezone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="America/Cancun">Cancun (EST)</option>
                  <option value="America/Mexico_City">Mexico City (CST)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Currency
                </label>
                <select
                  value={settings.default_currency}
                  onChange={(e) => updateSetting('default_currency', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="MXN">MXN - Mexican Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Multi-Company Support</span>
                <input
                  type="checkbox"
                  checked={settings.enable_multi_company}
                  onChange={(e) => updateSetting('enable_multi_company', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">External Bookings (Viator/GYG)</span>
                <input
                  type="checkbox"
                  checked={settings.enable_external_bookings}
                  onChange={(e) => updateSetting('enable_external_bookings', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Require Guide Check-ins</span>
                <input
                  type="checkbox"
                  checked={settings.require_guide_checkins}
                  onChange={(e) => updateSetting('require_guide_checkins', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Require Driver Check-ins</span>
                <input
                  type="checkbox"
                  checked={settings.require_driver_checkins}
                  onChange={(e) => updateSetting('require_driver_checkins', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Guest Feedback</span>
                <input
                  type="checkbox"
                  checked={settings.enable_guest_feedback}
                  onChange={(e) => updateSetting('enable_guest_feedback', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Activity Feed</span>
                <input
                  type="checkbox"
                  checked={settings.enable_activity_feed}
                  onChange={(e) => updateSetting('enable_activity_feed', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Operations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Guests per Tour
                </label>
                <input
                  type="number"
                  value={settings.default_guests_per_tour}
                  onChange={(e) => updateSetting('default_guests_per_tour', parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tours per Day
                </label>
                <input
                  type="number"
                  value={settings.max_tours_per_day}
                  onChange={(e) => updateSetting('max_tours_per_day', parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Incident Escalation</span>
                <input
                  type="checkbox"
                  checked={settings.incident_escalation_enabled}
                  onChange={(e) => updateSetting('incident_escalation_enabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Expense Approval Required</span>
                <input
                  type="checkbox"
                  checked={settings.expense_approval_required}
                  onChange={(e) => updateSetting('expense_approval_required', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <h2 className="text-lg font-semibold mb-4 text-red-600">⚠️ Maintenance Mode</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              {settings.maintenance_mode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Message
                  </label>
                  <textarea
                    value={settings.maintenance_message}
                    onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              When enabled, all users will see the maintenance message and cannot access the platform.
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
