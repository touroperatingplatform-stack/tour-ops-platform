'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Incident {
  id: string
  tour_id: string
  tour_name: string
  type: string
  severity: string
  status: string
  description: string
  guide_id: string
  guide_name: string
  assigned_to?: string
  assigned_to_name?: string
  assigned_at?: string
  escalation_level: number
  escalation_reason?: string
  photo_urls?: string[]
  created_at: string
  acknowledged_at?: string
  acknowledged_by?: string
  started_at?: string
  resolved_at?: string
  resolution_notes?: string
  resolution_category?: string
}

interface Comment {
  id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  role: string
}

export default function IncidentDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionCategory, setResolutionCategory] = useState('')
  const [showResolutionForm, setShowResolutionForm] = useState(false)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    loadIncident()
    loadUserProfile()
  }, [params.id])

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setUserRole(profile?.role || '')
  }

  async function loadIncident() {
    const { data: incidentData } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!incidentData) return

    // Fetch tour name
    const { data: tour } = await supabase
      .from('tours')
      .select('name')
      .eq('id', incidentData.tour_id)
      .single()

    // Fetch guide name
    const { data: guide } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', incidentData.guide_id)
      .single()

    // Fetch assignee name if assigned
    let assigneeName = undefined
    if (incidentData.assigned_to) {
      const { data: assignee } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', incidentData.assigned_to)
        .single()
      assigneeName = assignee ? `${assignee.first_name} ${assignee.last_name}` : undefined
    }

    setIncident({
      ...incidentData,
      tour_name: tour?.name || 'Unknown Tour',
      guide_name: guide ? `${guide.first_name} ${guide.last_name}` : 'Unknown',
      assigned_to_name: assigneeName
    })

    // Load comments
    const { data: commentsData } = await supabase
      .from('incident_comments')
      .select('id, author_id, body, created_at')
      .eq('incident_id', params.id)
      .order('created_at', { ascending: true })

    if (commentsData && commentsData.length > 0) {
      const authorIds = [...new Set(commentsData.map(c => c.author_id))]
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', authorIds)

      const authorMap = new Map(authors?.map(a => [a.id, `${a.first_name} ${a.last_name}`]))

      setComments(commentsData.map(c => ({
        ...c,
        author_name: authorMap.get(c.author_id) || 'Unknown'
      })))
    }

    // Load all profiles for assignment dropdown
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('role', ['guide', 'driver', 'operations', 'supervisor', 'manager'])
      .order('first_name')

    if (allProfiles) {
      setProfiles(allProfiles)
      if (incidentData.assigned_to) {
        setAssigneeId(incidentData.assigned_to)
      }
    }

    setLoading(false)
  }

  async function addComment() {
    if (!newComment.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('incident_comments')
      .insert({
        incident_id: params.id,
        author_id: user.id,
        body: newComment
      })

    if (!error) {
      setNewComment('')
      loadIncident()
    }
  }

  async function assignIncident() {
    if (!assigneeId) return

    const { error } = await supabase
      .from('incidents')
      .update({
        assigned_to: assigneeId,
        assigned_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .eq('id', params.id)

    if (!error) {
      loadIncident()
      alert('Incident assigned successfully')
    }
  }

  async function updateStatus(newStatus: string) {
    const updates: any = { status: newStatus }
    
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
      .eq('id', params.id)

    if (!error) {
      loadIncident()
    }
  }

  async function resolveIncident() {
    if (!resolutionNotes.trim()) {
      alert('Resolution notes are required')
      return
    }

    const { error } = await supabase
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
        resolution_category: resolutionCategory || 'other'
      })
      .eq('id', params.id)

    if (!error) {
      setShowResolutionForm(false)
      setResolutionNotes('')
      setResolutionCategory('')
      loadIncident()
      alert('Incident resolved successfully')
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      delay: '🚗',
      vehicle_issue: '🔧',
      medical: '🏥',
      guest_issue: '👤',
      weather: '🌧️',
      other: '⚠️'
    }
    return icons[type] || '⚠️'
  }

  function getSeverityColor(severity: string) {
    const colors: Record<string, string> = {
      critical: 'text-red-700 bg-red-100',
      high: 'text-orange-700 bg-orange-100',
      medium: 'text-yellow-700 bg-yellow-100',
      low: 'text-blue-700 bg-blue-100'
    }
    return colors[severity] || 'text-gray-700 bg-gray-100'
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      reported: 'text-red-700 bg-red-100',
      acknowledged: 'text-yellow-700 bg-yellow-100',
      in_progress: 'text-blue-700 bg-blue-100',
      resolved: 'text-green-700 bg-green-100',
      closed: 'text-gray-700 bg-gray-100'
    }
    return colors[status] || 'text-gray-700 bg-gray-100'
  }

  const canResolve = ['operations', 'supervisor', 'manager', 'company_admin', 'super_admin'].includes(userRole)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Incident not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/operations/incidents" className="text-blue-600 hover:text-blue-900 text-sm">
            ← {t('common.backToIncidents')}
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">{getTypeIcon(incident.type)}</span>
              <span>{incident.tour_name}</span>
            </h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(incident.status)}`}>
              {t(`incident.${incident.status}`)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('incident.details')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('incident.description')}</label>
                  <p className="text-gray-900 mt-1">{incident.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('common.type')}</label>
                    <p className="text-gray-900 mt-1">{t(`incident.${incident.type}`)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('common.severity')}</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
                        {t(`incident.${incident.severity}`)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('incident.guide')}</label>
                    <p className="text-gray-900 mt-1">{incident.guide_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('incident.reported')}</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(incident.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {incident.acknowledged_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('incident.acknowledgedAt')}</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(incident.acknowledged_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {incident.started_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('incident.startedAt')}</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(incident.started_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {incident.resolved_at && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t('incident.resolvedAt')}</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(incident.resolved_at).toLocaleString()}
                      </p>
                    </div>
                    {incident.resolution_category && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t('incident.resolutionCategory')}</label>
                        <p className="text-gray-900 mt-1 capitalize">{t(`incident.resolution.${incident.resolution_category}`) || incident.resolution_category}</p>
                      </div>
                    )}
                    {incident.resolution_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t('incident.resolutionNotes')}</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{incident.resolution_notes}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Photos */}
                {incident.photo_urls && incident.photo_urls.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">{t('incident.photos')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {incident.photo_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75"
                        >
                          <img src={url} alt={`Incident photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('incident.comments')}</h2>
              
              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.author_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.body}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">{t('common.noComments')}</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('incident.addComment') || 'Add a comment...'}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {t('common.post')}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('incident.assignment')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('common.assignedTo')}</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
                  >
                    <option value="">{t('common.unassigned')}</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>

                {incident.assigned_to_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('incident.assignedAt')}</label>
                    <p className="text-gray-900 mt-1 text-sm">
                      {incident.assigned_at ? new Date(incident.assigned_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                )}

                <button
                  onClick={assignIncident}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {t('incident.updateAssignment')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.actions')}</h2>
              
              <div className="space-y-3">
                {incident.status === 'reported' && (
                  <button
                    onClick={() => updateStatus('acknowledged')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                  >
                    ✓ {t('incident.acknowledge')}
                  </button>
                )}

                {incident.status === 'acknowledged' && (
                  <>
                    <button
                      onClick={() => updateStatus('in_progress')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      ▶ {t('incident.startWork')}
                    </button>
                    {canResolve && (
                      <button
                        onClick={() => setShowResolutionForm(true)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        ✓ {t('incident.resolve')}
                      </button>
                    )}
                  </>
                )}

                {incident.status === 'in_progress' && (
                  <>
                    {canResolve && (
                      <button
                        onClick={() => setShowResolutionForm(true)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        ✓ {t('incident.resolve')}
                      </button>
                    )}
                  </>
                )}

                {incident.status === 'resolved' && (
                  <button
                    onClick={() => updateStatus('closed')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                  >
                    {t('incident.close')}
                  </button>
                )}
              </div>
            </div>

            {/* Escalation */}
            {incident.escalation_level > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-red-900 mb-2">⚠️ {t('incident.escalated')}</h2>
                <p className="text-sm text-red-700">{t('incident.level')} {incident.escalation_level}</p>
                {incident.escalation_reason && (
                  <p className="text-sm text-red-700 mt-2">{incident.escalation_reason}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resolution Modal */}
        {showResolutionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('incident.resolveIncident')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('incident.resolutionCategory')}</label>
                  <select
                    value={resolutionCategory}
                    onChange={(e) => setResolutionCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">{t('incident.selectCategory')}</option>
                    <option value="repaired">{t('incident.resolution.repaired')}</option>
                    <option value="replaced">{t('incident.resolution.replaced')}</option>
                    <option value="refunded">{t('incident.resolution.refunded')}</option>
                    <option value="apologized">{t('incident.resolution.apologized')}</option>
                    <option value="other">{t('incident.resolution.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('incident.resolutionNotes')} *</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder={t('incident.resolutionNotesPlaceholder') || 'Describe what was done to resolve this incident...'}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResolutionForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={resolveIncident}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    {t('incident.resolve')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
