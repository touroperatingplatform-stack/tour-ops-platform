'use client'

import { useOfflineSync } from '@/hooks/useOfflineSync'

export default function SyncIndicator() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 text-center py-2 text-sm font-medium ${
      isOnline 
        ? 'bg-blue-500 text-white' 
        : 'bg-amber-500 text-white'
    }`}>
      {!isOnline ? (
        '📡 Offline mode - changes saved locally'
      ) : isSyncing ? (
        '↻ Syncing...'
      ) : pendingCount > 0 ? (
        `↻ ${pendingCount} pending changes`
      ) : null}
    </div>
  )
}
