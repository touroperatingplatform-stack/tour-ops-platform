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
    setLoading(true)
    try {
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
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1,
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

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              </div>
              <div className="border-8 border-transparent">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="border-8 border-transparent bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0 overflow-auto">
            <div className="border-8 border-transparent space-y-6">

              {/* General Settings */}
              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-6">
                <div className="border-8 border-transparent">
                  <h2 className="border-8 border-transparent text-lg font-semibold mb-4">General</h2>
                </div>
                <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Platform Name
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-1">
                      <input
                        type="text"
                        value={settings.platform_name}
                        onChange={(e) => updateSetting('platform_name', e.target.value)}
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="border-8 border-transparent">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Default Timezone
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-1">
                      <select
                        value={settings.default_timezone}
                        onChange={(e) => updateSetting('default_timezone', e.target.value)}
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="America/Cancun">Cancun (EST)</option>
                        <option value="America/Mexico_City">Mexico City (CST)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="America/Los_Angeles">Los Angeles (PST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-8 border-transparent">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Default Currency
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-1">
                      <select
                        value={settings.default_currency}
                        onChange={(e) => updateSetting('default_currency', e.target.value)}
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="MXN">MXN - Mexican Peso</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-6">
                <div className="border-8 border-transparent">
                  <h2 className="border-8 border-transparent text-lg font-semibold mb-4">Features</h2>
                </div>
                <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Multi-Company Support</span>
                      <input
                        type="checkbox"
                        checked={settings.enable_multi_company}
                        onChange={(e) => updateSetting('enable_multi_company', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">External Bookings (Viator/GYG)</span>
                      <input
                        type="checkbox"
                        checked={settings.enable_external_bookings}
                        onChange={(e) => updateSetting('enable_external_bookings', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Require Guide Check-ins</span>
                      <input
                        type="checkbox"
                        checked={settings.require_guide_checkins}
                        onChange={(e) => updateSetting('require_guide_checkins', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Require Driver Check-ins</span>
                      <input
                        type="checkbox"
                        checked={settings.require_driver_checkins}
                        onChange={(e) => updateSetting('require_driver_checkins', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Guest Feedback</span>
                      <input
                        type="checkbox"
                        checked={settings.enable_guest_feedback}
                        onChange={(e) => updateSetting('enable_guest_feedback', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Activity Feed</span>
                      <input
                        type="checkbox"
                        checked={settings.enable_activity_feed}
                        onChange={(e) => updateSetting('enable_activity_feed', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Operations */}
              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-6">
                <div className="border-8 border-transparent">
                  <h2 className="border-8 border-transparent text-lg font-semibold mb-4">Operations</h2>
                </div>
                <div className="border-8 border-transparent grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Default Guests per Tour
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-1">
                      <input
                        type="number"
                        value={settings.default_guests_per_tour}
                        onChange={(e) => updateSetting('default_guests_per_tour', parseInt(e.target.value))}
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="border-8 border-transparent">
                    <div className="border-8 border-transparent">
                      <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                        Max Tours per Day
                      </label>
                    </div>
                    <div className="border-8 border-transparent mt-1">
                      <input
                        type="number"
                        value={settings.max_tours_per_day}
                        onChange={(e) => updateSetting('max_tours_per_day', parseInt(e.target.value))}
                        className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Incident Escalation</span>
                      <input
                        type="checkbox"
                        checked={settings.incident_escalation_enabled}
                        onChange={(e) => updateSetting('incident_escalation_enabled', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Expense Approval Required</span>
                      <input
                        type="checkbox"
                        checked={settings.expense_approval_required}
                        onChange={(e) => updateSetting('expense_approval_required', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="border-8 border-transparent bg-white rounded-lg border-2 border-red-200 p-6">
                <div className="border-8 border-transparent">
                  <h2 className="border-8 border-transparent text-lg font-semibold mb-4 text-red-600">⚠️ Maintenance Mode</h2>
                </div>
                <div className="border-8 border-transparent space-y-4">
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="border-8 border-transparent text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
                      <input
                        type="checkbox"
                        checked={settings.maintenance_mode}
                        onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                        className="border-8 border-transparent w-4 h-4"
                      />
                    </label>
                  </div>
                  {settings.maintenance_mode && (
                    <div className="border-8 border-transparent">
                      <div className="border-8 border-transparent">
                        <label className="border-8 border-transparent block text-sm font-medium text-gray-700">
                          Maintenance Message
                        </label>
                      </div>
                      <div className="border-8 border-transparent mt-1">
                        <textarea
                          value={settings.maintenance_message}
                          onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                          className="border-8 border-transparent w-full border border-gray-300 rounded-lg px-3 py-2"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-xs text-gray-500 mt-2">
                    When enabled, all users will see the maintenance message and cannot access the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
