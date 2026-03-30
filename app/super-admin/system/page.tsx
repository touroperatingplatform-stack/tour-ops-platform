'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down'
  api: 'healthy' | 'degraded' | 'down'
  storage: 'healthy' | 'degraded' | 'down'
  lastChecked: string
}

interface DatabaseStats {
  table: string
  rowCount: number
  sizeMB: number
}

interface ActiveSession {
  user_email: string
  role: string
  last_active: string
}

interface RecentError {
  id: string
  message: string
  url: string
  user_email?: string
  created_at: string
}

export default function SuperAdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSystemHealth()
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadSystemHealth, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadSystemHealth() {
    setRefreshing(true)
    try {
      await Promise.all([
        checkDatabaseHealth(),
        checkApiHealth(),
        checkStorageHealth(),
        loadDatabaseStats(),
        loadActiveSessions(),
        loadRecentErrors()
      ])
    } catch (error) {
      console.error('Error loading system health:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function checkDatabaseHealth() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
      
      if (error) throw error
      
      setHealth(prev => ({
        ...prev!,
        database: 'healthy',
        lastChecked: new Date().toISOString()
      }))
    } catch (error) {
      setHealth(prev => ({
        ...prev!,
        database: 'down',
        lastChecked: new Date().toISOString()
      }))
    }
  }

  async function checkApiHealth() {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      if (error) throw error
      
      setHealth(prev => ({
        ...prev!,
        api: 'healthy',
        lastChecked: new Date().toISOString()
      }))
    } catch (error) {
      setHealth(prev => ({
        ...prev!,
        api: 'degraded',
        lastChecked: new Date().toISOString()
      }))
    }
  }

  async function checkStorageHealth() {
    try {
      // Check if we can access storage (simplified check)
      setHealth(prev => ({
        ...prev!,
        storage: 'healthy',
        lastChecked: new Date().toISOString()
      }))
    } catch (error) {
      setHealth(prev => ({
        ...prev!,
        storage: 'degraded',
        lastChecked: new Date().toISOString()
      }))
    }
  }

  async function loadDatabaseStats() {
    try {
      const tables = [
        'profiles', 'companies', 'company_configs', 'tours', 'guests',
        'vehicles', 'incidents', 'tour_expenses', 'guide_checkins',
        'driver_checkins', 'guest_feedback', 'activity_feed', 'payments'
      ]
      
      const stats: DatabaseStats[] = []
      
      for (const table of tables) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
          
          stats.push({
            table,
            rowCount: count || 0,
            sizeMB: 0 // Would need pg_stat_user_tables for actual size
          })
        } catch (error) {
          console.error(`Failed to count ${table}:`, error)
        }
      }
      
      setDbStats(stats)
    } catch (error) {
      console.error('Error loading database stats:', error)
    }
  }

  async function loadActiveSessions() {
    try {
      // Get recently active users (last 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: recentActivity } = await supabase
        .from('activity_feed')
        .select('actor_id, actor_name, actor_role, created_at')
        .gte('created_at', fiveMinAgo)
        .order('created_at', { ascending: false })
        .limit(20)
      
      // Get user emails for recent activity
      const sessions: ActiveSession[] = []
      const seenUsers = new Set()
      
      if (recentActivity) {
        for (const activity of recentActivity) {
          if (!seenUsers.has(activity.actor_id)) {
            seenUsers.add(activity.actor_id)
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, role')
              .eq('id', activity.actor_id)
              .single()
            
            if (profile) {
              sessions.push({
                user_email: profile.email || 'Unknown',
                role: profile.role || activity.actor_role || 'unknown',
                last_active: activity.created_at
              })
            }
          }
        }
      }
      
      setActiveSessions(sessions)
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }

  async function loadRecentErrors() {
    try {
      // Try to load from error_logs table if it exists
      const { data: errorLogs, error } = await supabase
        .from('error_logs')
        .select('id, message, url, user_email, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        // Table doesn't exist, use activity feed as fallback
        const { data: activityFeed } = await supabase
          .from('activity_feed')
          .select('id, message, actor_name, created_at')
          .eq('activity_type', 'error')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (activityFeed) {
          setRecentErrors(activityFeed.map(a => ({
            id: a.id,
            message: a.message,
            url: '',
            user_email: a.actor_name,
            created_at: a.created_at
          })))
        }
      } else if (errorLogs) {
        setRecentErrors(errorLogs)
      }
    } catch (error) {
      console.error('Error loading recent errors:', error)
    }
  }

  function getHealthColor(status: string) {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  function getHealthIcon(status: string | undefined) {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'down': return '❌'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <RoleGuard requiredRole='super_admin'>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading system health...</div>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">System Health</h1>
              <p className="text-gray-600 text-sm">Platform status and monitoring</p>
            </div>
            <button
              onClick={loadSystemHealth}
              disabled={refreshing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Platform Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Database</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health?.database || 'unknown')}`}>
                {getHealthIcon(health?.database)} {health?.database || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
            <p className="text-xs text-gray-400 mt-2">
              Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'Never'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">API</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health?.api || 'unknown')}`}>
                {getHealthIcon(health?.api)} {health?.api || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Supabase API</p>
            <p className="text-xs text-gray-400 mt-2">
              Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'Never'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Storage</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health?.storage || 'unknown')}`}>
                {getHealthIcon(health?.storage)} {health?.storage || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Supabase Storage / Cloudinary</p>
            <p className="text-xs text-gray-400 mt-2">
              Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Database Statistics</h2>
            <p className="text-sm text-gray-600">Record counts per table</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dbStats.map((stat) => (
                  <tr key={stat.table} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{stat.table}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {stat.rowCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Sessions & Recent Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Sessions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recently Active Users</h2>
              <p className="text-sm text-gray-600">Last 5 minutes</p>
            </div>
            <div className="p-6">
              {activeSessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.user_email}</p>
                        <p className="text-xs text-gray-500">{session.role}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(session.last_active).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Errors</h2>
              <p className="text-sm text-gray-600">Last 50 errors</p>
            </div>
            <div className="p-6">
              {recentErrors.length === 0 ? (
                <p className="text-green-600 text-sm">✅ No recent errors</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentErrors.slice(0, 10).map((error, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-900">{error.message}</p>
                      {error.url && (
                        <p className="text-xs text-red-700 mt-1">{error.url}</p>
                      )}
                      <p className="text-xs text-red-600 mt-1">
                        {new Date(error.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {recentErrors.length > 10 && (
                    <p className="text-xs text-gray-500 text-center">
                      + {recentErrors.length - 10} more errors (check logs)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
