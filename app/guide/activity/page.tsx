'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Activity {
  id: string
  actor_name: string
  actor_role: string
  activity_type: string
  target_name: string
  message: string
  photo_urls: string[] | null
  created_at: string
}

const activityIcons: Record<string, string> = {
  tour_started: '🚌',
  tour_completed: '✅',
  incident_reported: '🚨',
  expense_submitted: '💵',
  guest_no_show: '❌',
  vehicle_issue: '🔧',
  message: '💬',
}

const activityColors: Record<string, string> = {
  tour_started: 'bg-blue-100 text-blue-600',
  tour_completed: 'bg-green-100 text-green-600',
  incident_reported: 'bg-red-100 text-red-600',
  expense_submitted: 'bg-orange-100 text-orange-600',
  guest_no_show: 'bg-gray-100 text-gray-600',
  vehicle_issue: 'bg-yellow-100 text-yellow-600',
  message: 'bg-purple-100 text-purple-600',
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    loadActivities()
    
    // Real-time subscription
    const subscription = supabase
      .channel('activity_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadActivities() {
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setActivities(data)
    setLoading(false)
  }

  async function postMessage() {
    if (!newMessage.trim()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, company_id')
      .eq('id', session.user.id)
      .single()

    await supabase.from('activity_feed').insert({
      company_id: profile?.company_id,
      actor_id: session.user.id,
      actor_name: `${profile?.first_name} ${profile?.last_name}`,
      actor_role: profile?.role,
      activity_type: 'message',
      message: newMessage,
      is_public: true,
    })

    setNewMessage('')
  }

  function formatTime(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium sticky top-0 z-50">
          📡 Offline mode
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Feed</h1>
            <p className="text-sm text-gray-500">{activities.length} updates</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        </div>
      </header>

      {/* Activity Feed */}
      <div ref={scrollRef} className="p-4 space-y-4">
        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-4xl mb-4">📱</p>
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-2">Updates appear here in real-time</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                  activityColors[activity.activity_type] || 'bg-gray-100 text-gray-600'
                }`}>
                  {activityIcons[activity.activity_type] || '📝'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">
                      {activity.actor_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {activity.message}
                  </p>

                  {/* Photos */}
                  {activity.photo_urls && activity.photo_urls.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {activity.photo_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && postMessage()}
            placeholder="Send a message to the team..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={postMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-50">
        <div className="flex justify-around items-center">
          <Link href="/guide" className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs font-medium">Tours</span>
          </Link>
          <Link href="/guide/activity" className="flex flex-col items-center gap-1 p-2 text-blue-600">
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium">Feed</span>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
