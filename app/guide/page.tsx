'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, signOut } from '@/lib/auth'
import { Profile } from '@/lib/supabase/types'

export default function GuideDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      if (!p) { router.push('/login'); return }
      if (p.role !== 'guide') { router.push('/login'); return }
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
      <div className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Tour Ops</h1>
          <p className="text-blue-200 text-xs">Guide Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-100">
            {profile?.first_name} {profile?.last_name}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs bg-blue-700 px-3 py-1 rounded-lg hover:bg-blue-800"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-gray-800">Today's Actions</h2>

        <button
          onClick={() => router.push('/guide/tours')}
          className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
            📅
          </div>
          <div>
            <p className="font-semibold text-gray-900">My Tours</p>
            <p className="text-sm text-gray-500">View today's pickup schedule</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/guide/incidents/new')}
          className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
            🚨
          </div>
          <div>
            <p className="font-semibold text-gray-900">Report Incident</p>
            <p className="text-sm text-gray-500">Log a new incident</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/guide/checklist')}
          className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
            ✅
          </div>
          <div>
            <p className="font-semibold text-gray-900">Pre-Tour Checklist</p>
            <p className="text-sm text-gray-500">Complete your checklist</p>
          </div>
        </button>
      </div>
    </div>
  )
}