'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, signOut } from '@/lib/auth'
import { Profile } from '@/lib/supabase/types'

export default function SupervisorDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      if (!p) { router.push('/login'); return }
      const allowed = ['supervisor', 'manager', 'company_admin', 'super_admin']
      if (!allowed.includes(p.role)) { router.push('/login'); return }
      setProfile(p)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Tour Ops</h1>
          <p className="text-gray-400 text-xs capitalize">{profile?.role} Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">
            {profile?.first_name} {profile?.last_name}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800">Operations Overview</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-xs text-gray-500 mt-1">Active Tours</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-xs text-gray-500 mt-1">Guides On Tour</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-600">0</p>
            <p className="text-xs text-gray-500 mt-1">Open Incidents</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-bold text-yellow-600">0</p>
            <p className="text-xs text-gray-500 mt-1">Pending Approvals</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Today's Tours</h3>
          <p className="text-sm text-gray-400 text-center py-8">
            No tours scheduled yet. Create tours to see them here.
          </p>
        </div>
      </div>
    </div>
  )
}