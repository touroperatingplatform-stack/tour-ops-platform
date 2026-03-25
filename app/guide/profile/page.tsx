'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function GuideProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalTours: 0,
    completedTours: 0,
    upcomingTours: 0,
    thisMonth: 0,
  })
  const [upcomingTours, setUpcomingTours] = useState<any[]>([])
  const [recentChecklists, setRecentChecklists] = useState<any[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const userId = session.user.id

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, company:companies(name)')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        email: session.user.email || '',
      })
    }

    // Load stats
    const today = new Date().toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { count: total } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', userId)

    const { count: completed } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', userId)
      .eq('status', 'completed')

    const { count: upcoming } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', userId)
      .gte('tour_date', today)
      .in('status', ['scheduled', 'in_progress'])

    const { count: thisMonthCount } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', userId)
      .eq('status', 'completed')
      .gte('tour_date', monthAgo)

    setStats({
      totalTours: total || 0,
      completedTours: completed || 0,
      upcomingTours: upcoming || 0,
      thisMonth: thisMonthCount || 0,
    })

    // Load upcoming tours
    const { data: tours } = await supabase
      .from('tours')
      .select('id, name, tour_date, start_time, pickup_location, status')
      .eq('guide_id', userId)
      .gte('tour_date', today)
      .in('status', ['scheduled', 'in_progress'])
      .order('tour_date', { ascending: true })
      .limit(5)

    setUpcomingTours(tours || [])

    // Load recent checklists
    const { data: checklists } = await supabase
      .from('checklist_completions')
      .select('id, completed_at, tour:tours(name)')
      .eq('guide_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5)

    setRecentChecklists(checklists || [])
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
      loadData()
    } else {
      alert('Failed: ' + error.message)
    }
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-white">←</button>
          <span className="font-semibold">My Profile</span>
        </div>
      </header>

      <div className="p-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-800 text-3xl font-bold">
              {formData.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{formData.first_name} {formData.last_name}</p>
              <p className="text-blue-200">Tour Guide</p>
              <p className="text-blue-300 text-sm">{profile?.company?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-500">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalTours}</p>
              <p className="text-blue-200 text-sm">Total Tours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completedTours}</p>
              <p className="text-blue-200 text-sm">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.upcomingTours}</p>
              <p className="text-blue-200 text-sm">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-blue-200 text-sm">This Month</p>
            </div>
          </div>
        </div>

        {/* Upcoming Tours */}
        {upcomingTours.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Upcoming Tours</h3>
            <div className="space-y-2">
              {upcomingTours.map((tour) => (
                <Link
                  key={tour.id}
                  href={`/guide/tours/${tour.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <p className="font-medium text-gray-900">{tour.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tour.tour_date).toLocaleDateString()} at {tour.start_time} • {tour.pickup_location}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentChecklists.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Checklists</h3>
            <div className="space-y-2">
              {recentChecklists.map((item) => (
                <div key={item.id} className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">✅ {item.tour?.name}</p>
                  <p className="text-sm text-green-700">
                    Completed {new Date(item.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
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

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-2">
          <Link
            href="/guide/history"
            className="block py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-center"
          >
            📜 Tour History
          </Link>
          
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
