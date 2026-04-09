'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Incident {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
  tour_name: string
  guide_name: string
  location: string
  reported_at: string
  resolved_at: string | null
  assigned_to: string | null
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')

  useEffect(() => {
    loadIncidents()
  }, [])

  useEffect(() => {
    if (selectedIncident) {
      loadComments(selectedIncident.id)
    }
  }, [selectedIncident])

  async function loadIncidents() {
    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      setLoading(false)
      return
    }

    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, type, description, severity, status, tour_id, reported_by, created_at, company_id')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (incidentsData) {
      const tourIds = [...new Set(incidentsData.map((i: any) => i.tour_id).filter(Boolean))]
      const reporterIds = [...new Set(incidentsData.map((i: any) => i.reported_by).filter(Boolean))]
      
      const [{ data: toursData }, { data: reportersData }] = await Promise.all([
        supabase.from('tours').select('id, name').in('id', tourIds.length > 0 ? tourIds : ['00000000-0000-0000-0000-000000000000']),
        supabase.from('profiles').select('id, first_name, last_name').in('id', reporterIds.length > 0 ? reporterIds : ['00000000-0000-0000-0000-000000000000'])
      ])
      
      const tourMap = new Map(toursData?.map((t: any) => [t.id, t.name]) || [])
      const reporterMap = new Map(reportersData?.map((g: any) => [g.id, g]) || [])

      const formatted: Incident[] = incidentsData.map((i: any) => {
        const reporter = reporterMap.get(i.reported_by)
        return {
          id: i.id,
          title: i.type,
          description: i.description,
          severity: i.severity,
          status: i.status,
          tour_name: tourMap.get(i.tour_id) || 'Unknown',
          guide_name: reporter ? `${reporter.first_name} ${reporter.last_name}` : 'Unknown',
          location: '',
          reported_at: i.created_at,
          resolved_at: null,
          assigned_to: null
        }
      })
      setIncidents(formatted)
    }
    setLoading(false)
  }

  async function loadComments(incidentId: string) {
    const { data } = await supabase
      .from('incident_comments')
      .select('id, content, created_at, author_id')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true })

    if (data) {
      // Get author names
      const authorIds = [...new Set(data.map((c: any) => c.author_id).filter(Boolean))]
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', authorIds.length > 0 ? authorIds : ['00000000-0000-0000-0000-000000000000'])
      
      const authorMap = new Map(authorsData?.map((a: any) => [a.id, a]) || [])

      setComments(data.map((c: any) => {
        const author = authorMap.get(c.author_id)
        return {
          id: c.id,
          author_name: author ? `${author.first_name} ${author.last_name}` : 'Unknown',
          content: c.content,
          created_at: c.created_at
        }
      }))
    }
  }

  async function addComment() {
    if (!selectedIncident || !newComment.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('incident_comments')
      .insert({
        incident_id: selectedIncident.id,
        content: newComment,
        author_id: user?.id
      })

    setNewComment('')
    loadComments(selectedIncident.id)
  }

  async function updateStatus(id: string, newStatus: Incident['status']) {
    const updates: any = { status: newStatus }
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    await supabase
      .from('incidents')
      .update(updates)
      .eq('id', id)

    setIncidents(incidents.map(i => 
      i.id === id ? { ...i, status: newStatus, resolved_at: updates.resolved_at || i.resolved_at } : i
    ))
    
    if (selectedIncident?.id === id) {
      setSelectedIncident({ ...selectedIncident, status: newStatus })
    }
  }

  const filteredIncidents = incidents.filter(i => {
    const statusMatch = filter === 'all' ? true : 
      filter === 'open' ? ['reported', 'acknowledged', 'in_progress'].includes(i.status) :
      ['resolved', 'closed'].includes(i.status)
    const severityMatch = severityFilter === 'all' ? true : i.severity === severityFilter
    return statusMatch && severityMatch
  })

  const openCount = incidents.filter(i => 
    ['reported', 'acknowledged', 'in_progress'].includes(i.status)
  ).length

  function getSeverityBadge(severity: string) {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity]}`}>
        {severity}
      </span>
    )
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      reported: 'bg-blue-100 text-blue-700',
      acknowledged: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-500'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.reported}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading incidents...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-sm text-gray-500">{openCount} open incidents</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['open', 'closed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-300"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Tour/Guide</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reported</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredIncidents.map((incident) => (
              <tr key={incident.id} className="hover:bg-gray-50"
                onClick={() => setSelectedIncident(incident)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-xs">{incident.title}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {incident.tour_name}
                  <br />
                  <span className="text-xs">{incident.guide_name}</span>
                </td>
                <td className="px-4 py-3">{getSeverityBadge(incident.severity)}</td>
                <td className="px-4 py-3">{getStatusBadge(incident.status)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(incident.reported_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIncident(incident)
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredIncidents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Incident Detail Panel */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedIncident(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-xl rounded-lg overflow-hidden border-4 border-transparent">
            <div className="h-full overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Incident Details</h2>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Title</p>
                  <p className="text-sm font-medium text-gray-900">{selectedIncident.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-sm text-gray-700">{selectedIncident.description}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Severity</p>
                    <p className="text-sm">{getSeverityBadge(selectedIncident.severity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Status</p>
                    <p className="text-sm">{getStatusBadge(selectedIncident.status)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Location</p>
                  <p className="text-sm text-gray-900">{selectedIncident.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Reported</p>
                  <p className="text-sm text-gray-900">{new Date(selectedIncident.reported_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Status Actions */}
              {['reported', 'acknowledged', 'in_progress'].includes(selectedIncident.status) && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => updateStatus(selectedIncident.id, 'resolved')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => updateStatus(selectedIncident.id, 'closed')}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Comments */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Comments</h4>
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{comment.author_name}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>
                
                {/* Add Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <CreateIncidentModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={loadIncidents}
        />
      )}
    </div>
  )
}

// Create Incident Modal Component
function CreateIncidentModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [tourId, setTourId] = useState('')
  const [location, setLocation] = useState('')
  const [tours, setTours] = useState<{id: string, name: string}[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTours()
  }, [])

  async function loadTours() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tours')
      .select('id, name')
      .eq('tour_date', today)
      .order('start_time')
    
    if (data) {
      setTours(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: tour } = await supabase
      .from('tours')
      .select('guide_id')
      .eq('id', tourId)
      .single()

    await supabase.from('incidents').insert({
      title,
      description,
      severity,
      tour_id: tourId,
      guide_id: tour?.guide_id,
      location,
      status: 'reported',
      reported_by: user?.id
    })

    setSubmitting(false)
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Report New Incident</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Brief incident description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour</label>
            <select
              value={tourId}
              onChange={(e) => setTourId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select a tour</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>{tour.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Where did this occur?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                    severity === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Detailed description of what happened..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
