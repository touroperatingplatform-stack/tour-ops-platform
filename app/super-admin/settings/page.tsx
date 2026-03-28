'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { getLocalDate } from '@/lib/timezone'

interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  description?: string
}

const TIMEZONE_OPTIONS = [
  { value: 'America/Cancun', label: 'Cancun / Playa del Carmen (EST, no DST)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
]

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [timezone, setTimezone] = useState('America/Cancun')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data } = await supabase.from('system_settings').select('*')
      
      const settingsMap: Record<string, SystemSetting> = {}
      data?.forEach((s: SystemSetting) => {
        settingsMap[s.setting_key] = s
      })
      
      setSettings(settingsMap)
      
      // Set form values
      if (settingsMap.timezone) {
        setTimezone(settingsMap.timezone.setting_value)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveTimezone() {
    setSaving(true)
    setMessage(null)
    
    try {
      const existingTimezone = settings.timezone
      
      if (existingTimezone) {
        // Update existing
        const { error } = await supabase
          .from('system_settings')
          .update({ 
            setting_value: timezone,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'timezone')
        
        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('system_settings')
          .insert({
            setting_key: 'timezone',
            setting_value: timezone,
            description: 'Application timezone for date calculations'
          })
        
        if (error) throw error
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Timezone saved: ${TIMEZONE_OPTIONS.find(t => t.value === timezone)?.label || timezone}` 
      })
      
      // Reload settings
      setTimeout(() => loadSettings(), 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: '❌ Error saving: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <RoleGuard requiredRole="super_admin">
        <AdminNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* Timezone Setting */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">Timezone</h2>
                <p className="text-sm text-gray-500">Application-wide timezone for date calculations</p>
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>⚠️ Why this matters:</strong> On March 28, 2026, the driver assignment component showed 
                the wrong date (March 27) due to timezone mismatch. This setting ensures all components use 
                the same timezone for date calculations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <strong>Current date:</strong> {getLocalDate(timezone)}
                </div>
                <div>
                  <strong>UTC date:</strong> {new Date().toISOString().split('T')[0]}
                </div>
              </div>

              <button
                onClick={saveTimezone}
                disabled={saving}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Timezone'}
              </button>
            </div>
          </div>

          {/* More Settings Coming Soon */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💰</div>
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">Currency</h2>
                <p className="text-sm text-gray-500">Default currency for transactions</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
