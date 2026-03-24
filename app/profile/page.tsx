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

  if (loading) return <div className="p-4 text-center">Loading...</div>

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    manager: 'Manager',
    operations: 'Operations',
    supervisor: 'Supervisor',
    guide: 'Tour Guide',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-white">←</button>
          <span className="font-semibold">My Profile</span>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {formData.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{formData.first_name} {formData.last_name}</p>
              <p className="text-sm text-gray-500">{roleLabels[profile?.role] || profile?.role}</p>
              <p className="text-sm text-gray-400">{profile?.company?.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handlePasswordChange}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg"
            >
              Change Password
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="w-full py-3 bg-red-50 text-red-700 rounded-lg font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
