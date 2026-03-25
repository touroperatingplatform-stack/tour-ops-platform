'use client'

export const dynamic = 'force-dynamic'

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

interface OnlineUser {
  id: string
  name: string
  role: string
  last_seen: string
}

const activityIcons: Record<string, string> = {
  tour_started: '🚌',
  tour_completed: '✅',
  incident_reported: '🚨',
  expense_submitted: '💵',
  guest_no_show: '❌',
  vehicle_issue: '🔧',
  message: '💬',
  check_in: '📍',
  photo_shared: '📸',
}

const activityColors: Record<string, string> = {
  tour_started: 'bg-blue-100 text-blue-600',
  tour_completed: 'bg-green-100 text-green-600',
  incident_reported: 'bg-red-100 text-red-600',
  expense_submitted: 'bg-orange-100 text-orange-600',
  guest_no_show: 'bg-gray-100 text-gray-600',
  vehicle_issue: 'bg-yellow-100 text-yellow-600',
  message: 'bg-purple-100 text-purple-600',
  check_in: 'bg-indigo-100 text-indigo-600',
  photo_shared: 'bg-pink-100 text-pink-600',
}

const quickMessages = [
  'Heading to pickup',
  'Guests loaded',
  'Running 5 min late',
  'All good here',
  'Need assistance',
  'Tour completed',
]

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    loadActivities()
    loadOnlineUsers()
    
    // Real-time subscription
    const channel = supabase
      .channel('activity_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev])
      })
      .subscribe()

    // Update online status every minute
    const interval = setInterval(loadOnlineUsers, 60000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
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

  async function loadOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('user_presence')
      .select('user_id, last_seen, profiles(first_name, last_name, role)')
      .gte('last_seen', fiveMinutesAgo)

    if (data) {
      const users = data.map((u: any) => ({
        id: u.user_id,
        name: `${u.profiles.first_name} ${u.profiles.last_name}`,
        role: u.profiles.role,
        last_seen: u.last_seen,
      }))
      setOnlineUsers(users)
    }
  }

  async function postMessage(messageText: string = newMessage) {
    if (!messageText.trim()) return

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
      message: messageText,
      is_public: true,
    })

    setNewMessage('')
    setShowQuickMessages(false)
    
    // Scroll to top to see new message
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
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

  function formatTimeFull(date: string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header with online users */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Team Chat</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {onlineUsers.length} online
          </span>
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 3).map((user) => (
              <div 
                key={user.id}
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 border-2 border-white"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium rounded-xl">
          📡 Offline mode - messages will sync when connected
        </div>
      )}

      {/* Activity Feed */}
      <div ref={scrollRef} className="space-y-3 pb-4">
        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-4xl mb-4">📱</p>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to say hello!</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const isConsecutive = index > 0 && activities[index - 1].actor_name === activity.actor_name
            const showTime = index === 0 || 
              new Date(activity.created_at).getTime() - new Date(activities[index - 1].created_at).getTime() > 5 * 60 * 1000

            return (
              <div key={activity.id} className="space-y-1">
                {/* Time separator */}
                {showTime && (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {formatTimeFull(activity.created_at)}
                    </span>
                  </div>
                )}
                
                <div className={`flex gap-3 ${isConsecutive ? 'pt-0' : 'pt-2'}`}>
                  {/* Avatar */}
                  {!isConsecutive && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      activityColors[activity.activity_type] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {activityIcons[activity.activity_type] || activity.actor_name.charAt(0)}
                    </div>
                  )}
                  {isConsecutive && <div className="w-10 flex-shrink-0" />}

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    {!isConsecutive && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {activity.actor_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(activity.created_at)}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          • {activity.actor_role}
                        </span>
                      </div>
                    )}
                    
                    <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                      activity.activity_type === 'message'
                        ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                        : 'bg-white border border-gray-200'
                    }`}>
                      {activity.message}
                    </div>

                    {/* Photos */}
                    {activity.photo_urls && activity.photo_urls.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {activity.photo_urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      {showQuickMessages && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {quickMessages.map((msg) => (
            <button
              key={msg}
              onClick={() => postMessage(msg)}
              className="whitespace-nowrap px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 -mx-4 -mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            ⚡
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && postMessage()}
            placeholder="Send a message to the team..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-blue-500 text-base"
          />
          <button
            onClick={() => postMessage()}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
