import { supabase } from './supabase/client'

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string
  type: 'incident' | 'tour_started' | 'tour_completed' | 'reminder' | 'system'
  title: string
  message?: string
  data?: Record<string, any>
}) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      data: data || null,
      is_read: false,
    })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

// Notify all supervisors/managers about an incident
export async function notifySupervisorsAboutIncident({
  incidentId,
  tourId,
  tourName,
  guideName,
  description,
}: {
  incidentId: string
  tourId: string
  tourName: string
  guideName: string
  description: string
}) {
  // Get all supervisors and managers
  const { data: supervisors } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['supervisor', 'manager', 'company_admin'])
    .eq('is_active', true)

  if (!supervisors) return

  // Create notification for each supervisor
  for (const supervisor of supervisors) {
    await createNotification({
      userId: supervisor.id,
      type: 'incident',
      title: `Incident reported: ${tourName}`,
      message: `${guideName} reported: ${description.substring(0, 100)}...`,
      data: { incident_id: incidentId, tour_id: tourId },
    })
  }
}

// Notify operations about tour status changes
export async function notifyTourStatusChange({
  tourId,
  tourName,
  guideId,
  status,
}: {
  tourId: string
  tourName: string
  guideId: string
  status: 'started' | 'completed'
}) {
  // Get operations and supervisors
  const { data: staff } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['operations', 'supervisor', 'manager'])
    .eq('is_active', true)

  if (!staff) return

  const title = status === 'started' 
    ? `Tour started: ${tourName}` 
    : `Tour completed: ${tourName}`

  for (const person of staff) {
    await createNotification({
      userId: person.id,
      type: status === 'started' ? 'tour_started' : 'tour_completed',
      title,
      data: { tour_id: tourId },
    })
  }
}
