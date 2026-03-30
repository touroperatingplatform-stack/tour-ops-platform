'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Incident {
  id: string
  tour_name: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  created_at: string
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
  guide_name?: string
  acknowledged_at?: string
  assigned_to?: string
  escalation_level?: number
}

interface GuideCheckin {
  id: string
  guide_name: string
  tour_name: string
  checkin_type: string
  checked_in_at: string
  minutes_early_or_late: number
  location_accuracy: number
}

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  wind: number
}

interface OperationsMetrics {
  total_guests_today: number
  capacity_utilization: number
  on_time_percentage: number
  incidents_pending: number
  avg_checkin_accuracy: number
}

export function IncidentAlerts({ onIncidentUpdate }: { onIncidentUpdate?: () => void }) {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIncidents()
    
    // Poll for new incidents every 30 seconds
    const interval = setInterval(loadIncidents, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadIncidents() {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
    
    const { data: incidentsData, error } = await supabase
      .from('incidents')
      .select('id, type, severity, description, status, created_at, acknowledged_at, assigned_to, escalation_level, tour_id, guide_id')
      .gte('created_at', `${yesterday}T00:00:00`)
      .in('status', ['reported', 'acknowledged', 'in_progress'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading incidents:', error)
      setLoading(false)
      return
    }

    if (incidentsData) {
      // Fetch tour names separately
      const tourIds = [...new Set(incidentsData.map(i => i.tour_id).filter(Boolean))]
      const guideIds = [...new Set(incidentsData.map(i => i.guide_id).filter(Boolean))]
      
      const { data: tours } = await supabase.from('tours').select('id, name').in('id', tourIds.length > 0 ? tourIds : ['00000000-0000-0000-0000-000000000000'])
      const { data: guides } = await supabase.from('profiles').select('id, first_name, last_name').in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
      
      const tourMap = new Map(tours?.map(t => [t.id, t.name]))
      const guideMap = new Map(guides?.map(g => [g.id, `${g.first_name} ${g.last_name}`]))

      const formatted = incidentsData.map(i => ({
        id: i.id,
        tour_name: tourMap.get(i.tour_id) || 'Unknown Tour',
        type: i.type,
        severity: i.severity,
        description: i.description,
        created_at: i.created_at,
        acknowledged_at: i.acknowledged_at,
        status: i.status,
        guide_name: guideMap.get(i.guide_id) || 'Unknown',
        assigned_to: i.assigned_to,
        escalation_level: i.escalation_level
      }))
      setIncidents(formatted)
      onIncidentUpdate?.()
    }
    setLoading(false)
  }

  async function updateIncidentStatus(incidentId: string, newStatus: 'acknowledged' | 'in_progress' | 'resolved' | 'closed') {
    const updates: any = { status: newStatus }
    
    // Set timestamps based on status
    if (newStatus === 'acknowledged') {
      updates.acknowledged_at = new Date().toISOString()
    } else if (newStatus === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', incidentId)
    
    if (!error) {
      loadIncidents()
      onIncidentUpdate?.()
    } else {
      console.error('Failed to update incident:', error)
    }
  }

  async function assignIncident(incidentId: string, assigneeId: string) {
    const { error } = await supabase
      .from('incidents')
      .update({ 
        assigned_to: assigneeId,
        assigned_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .eq('id', incidentId)
    
    if (!error) {
      loadIncidents()
      onIncidentUpdate?.()
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      delay: '🚗',
      vehicle_issue: '🔧',
      vehicle_breakdown: '🔧',
      medical: '🏥',
      guest_injury: '🏥',
      guest_issue: '👤',
      weather: '🌧️',
      no_show: '❌',
      other: '⚠️'
    }
    return icons[type] || '⚠️'
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      reported: 'bg-red-100 text-red-700',
      acknowledged: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-600'
    }
    return styles[status] || styles.reported
  }

  if (loading) return <div className="text-sm text-gray-500 p-4">{t('common.loading')}</div>
  if (incidents.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">✅ {t('incidents.noActiveIncidents') || 'No active incidents'}</p>
        <p className="text-green-600 text-sm mt-1">{t('incidents.allToursNormal') || 'All tours operating normally'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-lg">🚨</span> {t('incidents.activeIncidents') || 'Active Incidents'}
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{incidents.length}</span>
        </h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {incidents.map((incident) => (
          <div key={incident.id} className={`border rounded-lg p-3 ${getSeverityColor(incident.severity)}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getTypeIcon(incident.type)}</span>
                  <span className="font-medium">{incident.tour_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(incident.status)}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                  {incident.escalation_level && incident.escalation_level > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-200 text-red-800 font-bold">
                      ⚠️ L{incident.escalation_level}
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-90 mb-2">{incident.description}</p>
                <div className="flex items-center gap-2 text-xs opacity-75">
                  <span>
                    {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {incident.acknowledged_at && (
                    <>
                      <span>•</span>
                      <span>Ack: {new Date(incident.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                  {incident.guide_name && (
                    <>
                      <span>•</span>
                      <span>{incident.guide_name}</span>
                    </>
                  )}
                  {incident.assigned_to && (
                    <>
                      <span>•</span>
                      <span>→ {incident.assigned_to}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <Link
                  href={`/operations/incidents/${incident.id}`}
                  className="px-2 py-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded text-xs font-medium text-center text-blue-600"
                >
                  {t('common.viewDetails') || 'View Details'} →
                </Link>
                {incident.status === 'reported' && (
                  <button
                    onClick={() => updateIncidentStatus(incident.id, 'acknowledged')}
                    className="px-2 py-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded text-xs font-medium"
                  >
                    ✓ {t('incidents.acknowledge') || 'Acknowledge'}
                  </button>
                )}
                {incident.status === 'acknowledged' && (
                  <>
                    <button
                      onClick={() => updateIncidentStatus(incident.id, 'in_progress')}
                      className="px-2 py-1 bg-white bg-opacity-75 hover:bg-opacity-100 rounded text-xs font-medium"
                    >
                      ▶ {t('incidents.start') || 'Start'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GuideCheckinStatus() {
  const { t } = useTranslation()
  const [checkins, setCheckins] = useState<GuideCheckin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCheckins()
  }, [])

  async function loadCheckins() {
    // Simple date filter - last 48 hours to catch all recent check-ins
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 172800000).toISOString()
    
    // First get check-ins without JOINs
    const { data: checkinsData } = await supabase
      .from('guide_checkins')
      .select('id, guide_id, tour_id, checkin_type, checked_in_at, minutes_early_or_late, location_accuracy')
      .gte('checked_in_at', twoDaysAgo)
      .order('checked_in_at', { ascending: false })
      .limit(20)

    if (!checkinsData || checkinsData.length === 0) {
      setCheckins([])
      setLoading(false)
      return
    }

    // Then fetch guide and tour names separately
    const guideIds = [...new Set(checkinsData.map(c => c.guide_id).filter(Boolean))]
    const tourIds = [...new Set(checkinsData.map(c => c.tour_id).filter(Boolean))]

    // Query specific guides referenced in check-ins (not random 100)
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])

    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name')
      .in('id', tourIds.length > 0 ? tourIds : ['00000000-0000-0000-0000-000000000000'])

    const guideMap = new Map(guidesData?.map((g: any) => [g.id, `${g.first_name} ${g.last_name}`]) || [])
    const tourMap = new Map(toursData?.map((t: any) => [t.id, t.name]) || [])

    const formatted = checkinsData.map((c: any) => ({
      id: c.id,
      guide_name: guideMap.get(c.guide_id) || 'Unknown',
      tour_name: tourMap.get(c.tour_id) || 'Unknown Tour',
      checkin_type: c.checkin_type,
      checked_in_at: c.checked_in_at,
      minutes_early_or_late: c.minutes_early_or_late,
      location_accuracy: c.location_accuracy
    }))

    setCheckins(formatted)
    setLoading(false)
  }

  function getPunctualityStatus(minutes: number) {
    const m = Math.abs(minutes)
    if (minutes >= 0) return { label: `${m}m ${t('time.early')}`, color: 'text-green-600' }
    if (minutes >= -5) return { label: `${m}m ${t('time.late')}`, color: 'text-yellow-600' }
    return { label: `${m}m ${t('time.late')}`, color: 'text-red-600' }
  }

  if (loading) return <div className="text-sm text-gray-500">{t('common.loading')}</div>

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="text-lg">📍</span> Recent Guide Check-ins
      </h3>

      <div className="space-y-2 max-h-64 overflow-auto">
        {checkins.map((checkin) => {
          const punctuality = getPunctualityStatus(checkin.minutes_early_or_late)
          return (
            <div key={checkin.id} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{checkin.guide_name}</p>
                  <p className="text-sm text-gray-600">{checkin.tour_name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${punctuality.color}`}>
                    {punctuality.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(checkin.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span>📍 Accuracy: {checkin.location_accuracy?.toFixed(0)}m</span>
                <span>•</span>
                <span className="capitalize">{checkin.checkin_type?.replace('_', ' ')}</span>
              </div>
            </div>
          )
        })}
        {checkins.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No check-ins today</p>
        )}
      </div>
    </div>
  )
}

export function OperationsMetrics() {
  const [metrics, setMetrics] = useState<OperationsMetrics>({
    total_guests_today: 0,
    capacity_utilization: 0,
    on_time_percentage: 100,
    incidents_pending: 0,
    avg_checkin_accuracy: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    const today = getLocalDate()
    const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]

    // Total guests (query both today and tomorrow for timezone)
    const { count: guestCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)

    // Tour capacity utilization (query both dates)
    const { data: tours } = await supabase
      .from('tours')
      .select('guest_count, capacity')
      .in('tour_date', [today, tomorrow])

    let totalGuests = 0
    let totalCapacity = 0
    tours?.forEach((t: any) => {
      totalGuests += t.guest_count || 0
      totalCapacity += t.capacity || 0
    })

    // On-time percentage from check-ins
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('minutes_early_or_late')
      .gte('checked_in_at', `${today}T00:00:00`)

    const onTimeCount = checkins?.filter((c: any) => (c.minutes_early_or_late || 0) >= -5).length || 0
    const onTimePct = checkins?.length ? (onTimeCount / checkins.length) * 100 : 100

    // Pending incidents
    const { count: incidentCount } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .in('status', ['reported', 'acknowledged'])
      .gte('created_at', `${today}T00:00:00`)

    // Average check-in accuracy
    const avgAccuracy = checkins?.length
      ? checkins.reduce((sum: number, c: any) => sum + (c.location_accuracy || 0), 0) / checkins.length
      : 0

    setMetrics({
      total_guests_today: guestCount || totalGuests,
      capacity_utilization: totalCapacity ? Math.round((totalGuests / totalCapacity) * 100) : 0,
      on_time_percentage: Math.round(onTimePct),
      incidents_pending: incidentCount || 0,
      avg_checkin_accuracy: Math.round(avgAccuracy)
    })
    setLoading(false)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading metrics...</div>

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="text-lg">📊</span> Operations Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-600 uppercase font-medium">Total Guests</p>
          <p className="text-2xl font-bold text-blue-700">{metrics.total_guests_today}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-600 uppercase font-medium">Capacity Used</p>
          <p className="text-2xl font-bold text-purple-700">{metrics.capacity_utilization}%</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-600 uppercase font-medium">On-Time Rate</p>
          <p className="text-2xl font-bold text-green-700">{metrics.on_time_percentage}%</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 uppercase font-medium">GPS Accuracy</p>
          <p className="text-2xl font-bold text-gray-700">±{metrics.avg_checkin_accuracy}m</p>
        </div>
      </div>

      {metrics.incidents_pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-700">
            ⚠️ <span className="font-medium">{metrics.incidents_pending}</span> incident{metrics.incidents_pending > 1 ? 's' : ''} pending attention
          </p>
        </div>
      )}
    </div>
  )
}
