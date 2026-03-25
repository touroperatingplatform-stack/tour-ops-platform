// Service Worker for Tour Ops PWA
// Handles offline caching and background sync

const CACHE_NAME = 'tour-ops-v1'
const STATIC_ASSETS = [
  '/',
  '/guide',
  '/login',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip API calls (let them fail naturally for offline queue)
  if (request.url.includes('/api/') || request.url.includes('supabase')) {
    return
  }
  
  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          // Cache successful responses
          if (fetchResponse.ok) {
            const clone = fetchResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return fetchResponse
        })
      )
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue())
  }
})

async function syncOfflineQueue() {
  // This would sync the offline queue when back online
  // Implementation in the app uses the queue system
  console.log('Background sync triggered')
}

// Push notifications (future)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/guide',
    },
  }
  
  event.waitUntil(
    self.registration.showNotification('Tour Ops', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/guide')
  )
})
