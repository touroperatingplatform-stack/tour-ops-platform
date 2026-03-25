'use client'

import { useEffect, useState } from 'react'
import { isOnline, getQueueCount, initOfflineListeners, syncOfflineQueue } from '@/lib/offline/queue'

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Initial state
    setOnline(isOnline())
    setQueueCount(getQueueCount())

    // Listen for online/offline
    const cleanup = initOfflineListeners(
      async () => {
        setOnline(true)
        setShowBanner(true)
        
        // Auto-sync when back online
        if (getQueueCount() > 0) {
          setSyncing(true)
          const result = await syncOfflineQueue()
          setSyncing(false)
          setQueueCount(getQueueCount())
          
          // Show success message briefly
          setTimeout(() => setShowBanner(false), 3000)
        } else {
          setTimeout(() => setShowBanner(false), 2000)
        }
      },
      () => {
        setOnline(false)
        setShowBanner(true)
      }
    )

    // Check queue count periodically
    const interval = setInterval(() => {
      setQueueCount(getQueueCount())
    }, 5000)

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [])

  if (!showBanner && online && queueCount === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all ${
      online 
        ? queueCount > 0 
          ? 'bg-yellow-500 text-white' 
          : 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {!online && <span className="text-xl">📡</span>}
          {online && queueCount > 0 && <span className="text-xl">⏳</span>}
          {online && queueCount === 0 && <span className="text-xl">✅</span>}
          
          <span className="font-medium text-sm">
            {!online 
              ? 'Offline - Actions will be queued'
              : syncing 
                ? `Syncing ${queueCount} queued items...`
                : queueCount > 0 
                  ? `${queueCount} items pending sync`
                  : 'Back online - All synced'
            }
          </span>
        </div>
        
        {online && queueCount > 0 && !syncing && (
          <button 
            onClick={async () => {
              setSyncing(true)
              await syncOfflineQueue()
              setSyncing(false)
              setQueueCount(getQueueCount())
            }}
            className="bg-white text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  )
}
