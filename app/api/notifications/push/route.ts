import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as OneSignal from '@onesignal/node-onesignal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY!

// Initialize OneSignal client
const configuration = OneSignal.createConfiguration({
  restApiKey: onesignalApiKey,
})
const client = new OneSignal.DefaultApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, data } = await request.json()

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create notification
    const notification = new OneSignal.Notification()
    notification.app_id = onesignalAppId
    notification.contents = {
      en: title,
    }
    notification.subtitle = {
      en: message || '',
    }
    notification.data = data || {}
    // Target by external user ID (Supabase auth ID)
    notification.include_external_user_ids = [userId]
    notification.channel_for_external_user_ids = 'push'

    const result = await client.createNotification(notification)

    // Store notification record
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase.from('push_notifications').insert({
      user_id: userId,
      title,
      body: message || '',
      data: data || {},
      sent_at: new Date().toISOString(),
      delivered_at: result.body?.id ? new Date().toISOString() : null,
    })

    return NextResponse.json({ success: true, id: result.body?.id })
  } catch (error: any) {
    console.error('Push notification error:', error)

    // Store failed notification
    try {
      const { userId, title, message } = await request.json()
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from('push_notifications').insert({
        user_id: userId,
        title,
        body: message || '',
        data: {},
        last_error: error.message,
      })
    } catch {}

    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}