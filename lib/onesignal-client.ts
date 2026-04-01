/**
 * OneSignal Web Push Setup
 * 
 * Client-side setup for web push notifications
 * Include this in your root layout or _app.tsx
 */

'use client'

import { useEffect } from 'react'
import { supabase } from './supabase/client'

// OneSignal App ID - set in .env.local
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

declare global {
  interface Window {
    OneSignal?: any
  }
}

/**
 * Initialize OneSignal for web push
 * Call this in your root layout or _app.tsx
 */
export function useOneSignal() {
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) {
      console.warn('OneSignal App ID not configured')
      return
    }

    // Load OneSignal SDK
    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.ts2.js'
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      initOneSignal()
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function initOneSignal() {
    if (!window.OneSignal) return

    try {
      await window.OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        welcomeNotification: {
          title: 'Tour Ops',
          message: 'Thanks for subscribing!',
        },
        notifyButton: {
          enable: true,
          showCredit: false,
        },
      })

      // Listen for subscription changes
      window.OneSignal.User.addEventListener('change', (event: any) => {
        if (event.pushSubscription.id) {
          // User subscribed - store their OneSignal ID
          syncSubscriptionWithUser()
        }
      })

      // If already logged in, sync subscription
      syncSubscriptionWithUser()
    } catch (error) {
      console.error('OneSignal init error:', error)
    }
  }
}

/**
 * Sync OneSignal subscription with user account
 */
export async function syncSubscriptionWithUser() {
  if (!window.OneSignal) return

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Set external user ID for OneSignal
    const subscriptionId = window.OneSignal.User.pushSubscription.id
    if (subscriptionId) {
      await window.OneSignal.login(user.id)
      console.log('OneSignal synced with user:', user.id)
    }
  } catch (error) {
    console.error('Error syncing OneSignal:', error)
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!window.OneSignal) {
    console.warn('OneSignal not loaded')
    return false
  }

  try {
    await window.OneSignal.Slidedown.promptPush()
    return true
  } catch (error) {
    console.error('Error requesting push permission:', error)
    return false
  }
}

/**
 * Check if user is subscribed to push
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!window.OneSignal) return false

  try {
    return await window.OneSignal.User.pushSubscription.optedIn()
  } catch {
    return false
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  if (!window.OneSignal) return

  try {
    await window.OneSignal.User.pushSubscription.optOut()
  } catch (error) {
    console.error('Error unsubscribing:', error)
  }
}