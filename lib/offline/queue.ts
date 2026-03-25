// Offline queue system for Guide actions
// Stores actions when no connection, syncs when back online

export type QueuedAction = {
  id: string
  type: 'checkin' | 'incident' | 'expense' | 'tour_complete'
  tourId: string
  data: Record<string, any>
  photos: string[] // Base64 encoded
  timestamp: number
  retryCount: number
}

const QUEUE_KEY = 'tour_ops_offline_queue'

export function getOfflineQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(QUEUE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getOfflineQueue()
  const newAction: QueuedAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  }
  queue.push(newAction)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function removeFromQueue(actionId: string): void {
  const queue = getOfflineQueue()
  const filtered = queue.filter(a => a.id !== actionId)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
}

export function updateQueueItem(action: QueuedAction): void {
  const queue = getOfflineQueue()
  const index = queue.findIndex(a => a.id === action.id)
  if (index >= 0) {
    queue[index] = action
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

export function getQueueCount(): number {
  return getOfflineQueue().length
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Listen for online/offline events
export function initOfflineListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Sync function placeholder - implemented in sync.ts
export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  // This will be imported from sync.ts
  return { success: 0, failed: 0 }
}
