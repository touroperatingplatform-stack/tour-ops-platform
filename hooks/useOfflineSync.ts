'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SyncQueueItem {
  id: string
  action_type: string
  table_name: string
  payload: any
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  error_message?: string
  created_at: string
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingItems()
    }
    
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial load of pending count
    loadPendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function loadPendingCount() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { count } = await supabase
      .from('offline_sync_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('status', 'pending')

    setPendingCount(count || 0)
  }

  async function queueForSync(actionType: string, tableName: string, payload: any) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // If online, try to save directly first
    if (navigator.onLine) {
      try {
        // Direct insert based on table
        if (tableName === 'tour_expenses') {
          await supabase.from('tour_expenses').insert(payload)
        } else if (tableName === 'incidents') {
          await supabase.from('incidents').insert(payload)
        }
        return { success: true, queued: false }
      } catch (error) {
        // Fall through to queue
      }
    }

    // Queue for later sync
    const { error } = await supabase.from('offline_sync_queue').insert({
      user_id: session.user.id,
      action_type: actionType,
      table_name: tableName,
      payload,
      status: 'pending',
    })

    if (!error) {
      setPendingCount(prev => prev + 1)
    }

    return { success: !error, queued: true, error }
  }

  async function syncPendingItems() {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setIsSyncing(false)
      return
    }

    // Call the sync function
    const { data } = await supabase.rpc('process_sync_queue', {
      p_user_id: session.user.id,
    })

    await loadPendingCount()
    setIsSyncing(false)

    return data
  }

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueForSync,
    syncPendingItems,
  }
}
