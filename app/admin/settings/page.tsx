'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface SettingItem {
  id: string
  label: string
  value: string
  icon: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([
    { id: 'company', label: 'Company Name', value: 'Tour Ops Platform', icon: '🏢' },
    { id: 'timezone', label: 'Timezone', value: 'America/Cancun', icon: '🌎' },
    { id: 'currency', label: 'Currency', value: 'USD', icon: '💵' },
    { id: 'language', label: 'Language', value: 'English', icon: '🌐' },
  ])
  const [actions] = useState([
    { id: 'notifications', label: 'Notifications', icon: '🔔', hasToggle: true },
    { id: 'auto_dispatch', label: 'Auto Dispatch', icon: '🤖', hasToggle: false },
    { id: 'checklist', label: 'Require Checklist', icon: '✓', hasToggle: true },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    // Load from database
    setLoading(false)
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
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your account</p>
      </div>

      {/* Settings List */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Profile Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <div className="font-bold text-lg">Company Admin</div>
              <div className="text-gray-500 text-sm">admin@lifeoperations.com</div>
            </div>
          </div>
        </div>

        {/* Company Settings */}
        <div className="mb-6">
          <h2 className="text-gray-500 text-xs font-semibold uppercase mb-2">Company</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {settings.map((setting, i) => (
              <button
                key={setting.id}
                className={`w-full px-4 py-3 flex items-center gap-3 ${
                  i !== settings.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="text-xl">{setting.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{setting.label}</div>
                  <div className="text-gray-500 text-sm">{setting.value}</div>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <h2 className="text-gray-500 text-xs font-semibold uppercase mb-2">Preferences</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {actions.map((action, i) => (
              <div
                key={action.id}
                className={`px-4 py-3 flex items-center gap-3 ${
                  i !== actions.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="text-xl">{action.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{action.label}</div>
                </div>
                {action.hasToggle && (
                  <div className="w-10 h-6 bg-blue-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="mb-6">
          <h2 className="text-gray-500 text-xs font-semibold uppercase mb-2">Account</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <button className="w-full px-4 py-3 flex items-center gap-3 border-b text-red-600">
              <span className="text-xl">🚪</span>
              <div className="font-medium">Sign Out</div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
