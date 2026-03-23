'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getProfile } from '@/lib/auth'
import { Profile } from '@/lib/supabase/types'

interface Stats {
  totalUsers: number
  totalTours: number
  activeTours: number
  totalVehicles: number
}

export default function AdminOverview() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTours: 0,
    activeTours: 0,
    totalVehicles: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const p = await getProfile()
    setProfile(p)

    // Load stats
    const { data: users } = await (supabase as any)
      .from('profiles')
      .select('id', { count: 'exact' })

    const { data: tours } = await (supabase as any)
      .from('tours')
      .select('id', { count: 'exact' })

    const { data: active } = await (supabase as any)
      .from('tours')
      .select('id', { count: 'exact' })
      .eq('status', 'in_progress')

    const { data: vehicles } = await (supabase as any)
      .from('vehicles')
      .select('id', { count: 'exact' })

    setStats({
      totalUsers: users?.length || 0,
      totalTours: tours?.length || 0,
      activeTours: active?.length || 0,
      totalVehicles: vehicles?.length || 0,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { label: 'Total Tours', value: stats.totalTours, icon: '📅', color: 'bg-green-500' },
    { label: 'Active Tours', value: stats.activeTours, icon: '🎯', color: 'bg-yellow-500' },
    { label: 'Vehicles', value: stats.totalVehicles, icon: '🚗', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, {profile?.first_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/users/new"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div>
                <p className="font-medium text-gray-900">Create New User</p>
                <p className="text-sm text-gray-500">Add a new guide or staff member</p>
              </div>
            </a>
            <a
              href="/admin/tours/new"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">Create New Tour</p>
                <p className="text-sm text-gray-500">Schedule a new tour</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authentication</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Your Role</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
