'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import DriverNav from '@/components/navigation/DriverNav'

export default function DriverProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{
    email: string
    full_name: string
    role: string
  } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('email, full_name, role')
        .eq('id', user.id)
        .single()

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole="driver">
      <DriverNav />
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Your account settings</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0) || 'D'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{profile?.full_name || 'Driver'}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Role</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{profile?.role || 'driver'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-700 rounded-2xl p-4 font-medium border border-red-200 hover:bg-red-100 transition-colors"
        >
          🚪 Sign Out
        </button>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400">Tour Ops Platform</p>
          <p className="text-xs text-gray-400">Driver Portal</p>
        </div>
      </div>
    </RoleGuard>
  )
}
