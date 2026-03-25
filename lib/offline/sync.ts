// Sync offline queue when back online
import { supabase } from '@/lib/supabase/client'
import { 
  getOfflineQueue, 
  removeFromQueue, 
  updateQueueItem,
  QueuedAction 
} from './queue'

export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { success: 0, failed: 0 }
  
  let success = 0
  let failed = 0
  
  for (const action of queue) {
    try {
      await processAction(action)
      removeFromQueue(action.id)
      success++
    } catch (err) {
      action.retryCount++
      if (action.retryCount >= 3) {
        // Give up after 3 tries, keep for manual review
        failed++
      } else {
        updateQueueItem(action)
      }
    }
  }
  
  return { success, failed }
}

async function processAction(action: QueuedAction): Promise<void> {
  const { type, tourId, data, photos } = action
  
  switch (type) {
    case 'checkin':
      await syncCheckin(tourId, data, photos)
      break
    case 'incident':
      await syncIncident(tourId, data, photos)
      break
    case 'expense':
      await syncExpense(tourId, data, photos)
      break
    case 'tour_complete':
      await syncTourComplete(tourId, data, photos)
      break
  }
}

async function syncCheckin(tourId: string, data: any, photos: string[]) {
  // Upload photos first if any
  const photoUrls = await uploadBase64Photos(photos)
  
  await supabase.from('guide_checkins').insert({
    tour_id: tourId,
    ...data,
    selfie_url: photoUrls[0] || null,
    synced_from_offline: true,
  })
}

async function syncIncident(tourId: string, data: any, photos: string[]) {
  const photoUrls = await uploadBase64Photos(photos)
  
  await supabase.from('incidents').insert({
    tour_id: tourId,
    ...data,
    photo_urls: photoUrls,
    synced_from_offline: true,
  })
}

async function syncExpense(tourId: string, data: any, photos: string[]) {
  const photoUrls = await uploadBase64Photos(photos)
  
  await supabase.from('expenses').insert({
    tour_id: tourId,
    ...data,
    receipt_url: photoUrls[0] || null,
    synced_from_offline: true,
  })
}

async function syncTourComplete(tourId: string, data: any, photos: string[]) {
  const photoUrls = await uploadBase64Photos(photos)
  
  await supabase.from('tours').update({
    ...data,
    report_photos: photoUrls,
    synced_from_offline: true,
  }).eq('id', tourId)
}

async function uploadBase64Photos(base64Photos: string[]): Promise<string[]> {
  // Convert base64 to files and upload
  const urls: string[] = []
  
  for (const base64 of base64Photos) {
    try {
      // Convert base64 to blob
      const response = await fetch(base64)
      const blob = await response.blob()
      
      // Create file
      const file = new File([blob], `offline_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      // Upload via Cloudinary
      const { uploadToCloudinary } = await import('@/lib/cloudinary/upload')
      const url = await uploadToCloudinary(file)
      
      if (url) urls.push(url)
    } catch {
      // Skip failed uploads
    }
  }
  
  return urls
}
