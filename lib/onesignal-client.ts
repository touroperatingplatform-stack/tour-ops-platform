/**
 * OneSignal Web Push Setup
 * 
 * Client-side setup for web push notifications
 */

'use client'

import { useEffect } from 'react'
import { supabase } from './supabase/client'

// OneSignal App ID - set in .env.local
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

declare global {
  interface Window {
    OneSignal?: any
    OneSignalDeferred?: any[]
  }
}

/**
 * Initialize OneSignal for web push
 */
export function useOneSignal() {
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) {
      console.warn('OneSignal App ID not configured')
      return
    }

    // OneSignal is loaded via script tag in layout.tsx
    // Initialize via OneSignalDeferred
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        })

        // Listen for subscription changes
        OneSignal.User.addEventListener('change', (event: any) => {
          if (event.pushSubscription?.id) {
            syncSubscriptionWithUser()
          }
        })

        // If already logged in, sync subscription
        syncSubscriptionWithUser()
      })
    }
  }, [])
}

/**
 * Sync OneSignal subscription with user account
 */
export async function syncSubscriptionWithUser() {
  if (typeof window === 'undefined' || !window.OneSignalDeferred) return

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      await OneSignal.login(user.id)
      console.log('OneSignal synced with user:', user.id)
    })
  } catch (error) {
    console.error('Error syncing OneSignal:', error)
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.OneSignalDeferred) return false

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      try {
        await OneSignal.Slidedown.promptPush()
        resolve(true)
      } catch (error) {
        console.error('Error requesting push permission:', error)
        resolve(false)
      }
    })
  })
}

/**
 * Check if user is subscribed to push
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.OneSignalDeferred) return false

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      try {
        const optedIn = await OneSignal.User.pushSubscription.optedIn()
        resolve(optedIn)
      } catch {
        resolve(false)
      }
    })
  })
}