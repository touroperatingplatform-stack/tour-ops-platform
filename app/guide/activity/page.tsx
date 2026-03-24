'use client'

import { useEffect, useState, useRef } from 'react'
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
    
    const channel = supabase
      .channel('activity_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev])
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
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
      <div className="space-y-4">
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium rounded-xl">
          📡 Offline mode
        </div>
      )}

      {/* Activity Feed */}
      <div ref={scrollRef} className="space-y-3">
        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-4xl mb-4">📱</p>
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-2">Updates appear here in real-time</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  activityColors[activity.activity_type] || 'bg-gray-100 text-gray-600'
                }`}>
                  {activityIcons[activity.activity_type] || '📝'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {activity.actor_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm">
                    {activity.message}
                  </p>

                  {activity.photo_urls && activity.photo_urls.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {activity.photo_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
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
      <div className="bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-4">
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
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
