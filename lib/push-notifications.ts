/**
 * Send push notification to a user via API
 * Call this from client components
 */
export async function sendPushNotification({
  userId,
  title,
  message,
  data,
}: {
  userId: string
  title: string
  message?: string
  data?: Record<string, any>
}) {
  try {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, message, data }),
    })

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify guide about tour assignment
 */
export async function notifyTourAssignment({
  guideId,
  tourId,
  tourName,
  tourDate,
}: {
  guideId: string
  tourId: string
  tourName: string
  tourDate: string
}) {
  const formattedDate = new Date(tourDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return sendPushNotification({
    userId: guideId,
    title: 'New Tour Assigned',
    message: `${tourName} on ${formattedDate}`,
    data: {
      type: 'tour_assignment',
      tourId,
    },
  })
}