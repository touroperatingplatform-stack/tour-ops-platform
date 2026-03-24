'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('profiles')
      .select('*, company:companies(name)')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: session.user.email || '',
      })
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (!error) {
      alert('Profile updated!')
      loadProfile()
    } else {
      alert('Failed to update: ' + error.message)
    }
  }

  async function handlePasswordChange() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return

    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: window.location.origin + '/auth/callback',
    })

    if (!error) {
      alert('Password reset email sent!')
    } else {
      alert('Failed: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    manager: 'Manager',
    operations: 'Operations',
    supervisor: 'Supervisor',
    guide: 'Tour Guide',
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {formData.first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{formData.first_name} {formData.last_name}</p>
            <p className="text-sm text-gray-500">{roleLabels[profile?.role] || profile?.role}</p>
            <p className="text-sm text-gray-400">{profile?.company?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={handlePasswordChange}
              className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out */}
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/login'
        }}
        className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-medium"
      >
        Sign Out
      </button>
    </div>
  )
}
