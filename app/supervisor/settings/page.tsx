'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SupervisorSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_alerts: true,
    auto_assign_tours: false,
    default_view: 'live',
    team_size_limit: 10,
  })

  function handleChange(field: string, value: string | boolean | number) {
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
        <h1 className="text-2xl font-bold text-gray-900">Supervisor Settings</h1>
        <p className="text-gray-500 mt-1">Manage your supervisor preferences</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts for incidents and updates</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('notifications_enabled', !settings.notifications_enabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.notifications_enabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications_enabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Alerts</p>
              <p className="text-sm text-gray-500">Get critical alerts via email</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('email_alerts', !settings.email_alerts)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.email_alerts ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.email_alerts ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Operations</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto Assign Tours</p>
              <p className="text-sm text-gray-500">Automatically assign guides to scheduled tours</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('auto_assign_tours', !settings.auto_assign_tours)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.auto_assign_tours ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.auto_assign_tours ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Dashboard View</label>
            <select
              value={settings.default_view}
              onChange={(e) => handleChange('default_view', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="live">Live Tours</option>
              <option value="today">Today's Schedule</option>
              <option value="incidents">Incidents</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Size Limit</label>
            <input
              type="number"
              min={1}
              value={settings.team_size_limit}
              onChange={(e) => handleChange('team_size_limit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum guides to display on dashboard</p>
          </div>
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
