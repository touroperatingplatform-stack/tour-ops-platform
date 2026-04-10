'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Incident {
  id: string
  tour_name: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
  description: string
  created_at: string
  guide_name: string
  guide_id: string
  assigned_to?: string
  assigned_to_name?: string
  escalation_level: number
}

export default function IncidentsPage() {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMyIncidents, setFilterMyIncidents] = useState<boolean>(false)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [assignTo, setAssignTo] = useState<string>('')
  const [availableStaff, setAvailableStaff] = useState<{id: string, name: string}[]>([])
  const [actionLoading, setActionLoading] = useState<string>('')

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUserId) {
      loadIncidents()
    }
  }, [currentUserId])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  async function loadIncidents() {
    // Get user's company_id first
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

    // Get tours for this company first
    const { data: companyTours } = await supabase
      .from('tours')
      .select('id')
      .eq('company_id', profile.company_id)

    const tourIds = companyTours?.map(t => t.id) || []
    
    if (tourIds.length === 0) {
      setIncidents([])
      setLoading(false)
      return
    }

    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, type, severity, status, description, created_at, guide_id, assigned_to, escalation_level, tour_id')
      .in('tour_id', tourIds)
      .order('created_at', { ascending: false })

    if (!incidentsData) {
      setLoading(false)
      return
    }

    const tourIds = [...new Set(incidentsData.map(i => i.tour_id).filter(Boolean))]
    const guideIds = [...new Set(incidentsData.map(i => i.guide_id).filter(Boolean))]
    const assigneeIds = [...new Set(incidentsData.map(i => i.assigned_to).filter(Boolean))]

    const { data: tours } = await supabase.from('tours').select('id, name').in('id', tourIds.length > 0 ? tourIds : ['00000000-0000-0000-0000-000000000000'])
    const { data: guides } = await supabase.from('profiles').select('id, first_name, last_name').in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
    const { data: assignees } = await supabase.from('profiles').select('id, first_name, last_name, role').in('id', assigneeIds.length > 0 ? assigneeIds : ['00000000-0000-0000-0000-000000000000'])

    const tourMap = new Map(tours?.map(t => [t.id, t.name]))
    const guideMap = new Map(guides?.map(g => [g.id, `${g.first_name} ${g.last_name}`]))
    const assigneeMap = new Map(assignees?.map(a => [a.id, `${a.first_name} ${a.last_name}`]))

    const formatted = incidentsData.map(i => ({
      id: i.id,
      tour_name: tourMap.get(i.tour_id) || 'Unknown Tour',
      type: i.type,
      severity: i.severity,
      status: i.status,
      description: i.description,
      created_at: i.created_at,
      guide_name: guideMap.get(i.guide_id) || 'Unknown',
      guide_id: i.guide_id,
      assigned_to: i.assigned_to,
      assigned_to_name: i.assigned_to ? assigneeMap.get(i.assigned_to) : undefined,
      escalation_level: i.escalation_level || 0
    }))

    setIncidents(formatted)
    setLoading(false)
  }

  async function loadAvailableStaff() {
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('role', ['super_admin', 'company_admin', 'manager', 'supervisor', 'operations'])
    
    if (staff) {
      setAvailableStaff(staff.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`
      })))
    }
  }

  function openAssignModal(incident: Incident) {
    setSelectedIncident(incident)
    setAssignTo(incident.assigned_to || '')
    loadAvailableStaff()
    setAssignModalOpen(true)
  }

  async function handleAssign() {
    if (!selectedIncident || !assignTo) return
    
    setActionLoading(`assign-${selectedIncident.id}`)
    
    const { error } = await supabase
      .from('incidents')
      .update({ 
        assigned_to: assignTo,
        status: 'acknowledged'
      })
      .eq('id', selectedIncident.id)

    if (!error) {
      await loadIncidents()
      setAssignModalOpen(false)
      setSelectedIncident(null)
    }
    
    setActionLoading('')
  }

  async function handleAcknowledge(incidentId: string) {
    setActionLoading(`ack-${incidentId}`)
    
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'acknowledged' })
      .eq('id', incidentId)

    if (!error) {
      await loadIncidents()
    }
    
    setActionLoading('')
  }

  async function handleStartWork(incidentId: string) {
    setActionLoading(`start-${incidentId}`)
    
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'in_progress' })
      .eq('id', incidentId)

    if (!error) {
      await loadIncidents()
    }
    
    setActionLoading('')
  }

  async function handleResolve(incidentId: string) {
    setActionLoading(`resolve-${incidentId}`)
    
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'resolved' })
      .eq('id', incidentId)

    if (!error) {
      await loadIncidents()
    }
    
    setActionLoading('')
  }

  async function handleClose(incidentId: string) {
    setActionLoading(`close-${incidentId}`)
    
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'closed' })
      .eq('id', incidentId)

    if (!error) {
      await loadIncidents()
    }
    
    setActionLoading('')
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

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      reported: '🔴 ' + t('incident.reported'),
      acknowledged: '🟡 ' + t('incident.acknowledged'),
      in_progress: '🔵 ' + t('incident.inProgress'),
      resolved: '🟢 ' + t('incident.resolved'),
      closed: '⚫ ' + t('incident.closed')
    }
    return badges[status] || status
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

  function getEscalationBadge(level: number) {
    if (level <= 0) return null
    const colors = {
      1: 'bg-red-600 text-white',
      2: 'bg-orange-500 text-white',
      3: 'bg-yellow-500 text-white'
    }
    return (
      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded ${colors[level as keyof typeof colors] || 'bg-gray-500 text-white'}`}>
        🔴 L{level}
      </span>
    )
  }

  function getSortedIncidents() {
    return [...incidents].sort((a, b) => {
      // L1/L2 first
      if (a.escalation_level > 0 && b.escalation_level === 0) return -1
      if (b.escalation_level > 0 && a.escalation_level === 0) return 1
      if (a.escalation_level > b.escalation_level) return -1
      if (b.escalation_level > a.escalation_level) return 1
      
      // Then by status priority
      const statusPriority: Record<string, number> = {
        reported: 1,
        acknowledged: 2,
        in_progress: 3,
        resolved: 4,
        closed: 5
      }
      const aPriority = statusPriority[a.status] || 99
      const bPriority = statusPriority[b.status] || 99
      if (aPriority !== bPriority) return aPriority - bPriority
      
      // Then by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  const filtered = getSortedIncidents().filter(i => {
    if (filterMyIncidents && i.assigned_to !== currentUserId) return false
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
    if (filterType !== 'all' && i.type !== filterType) return false
    if (dateFrom && new Date(i.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(i.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const stats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'reported').length,
    acknowledged: incidents.filter(i => i.status === 'acknowledged').length,
    in_progress: incidents.filter(i => i.status === 'in_progress').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  }

  const types = [...new Set(incidents.map(i => i.type))]

  function renderActionButton(incident: Incident) {
    const isLoading = actionLoading !== ''
    
    switch (incident.status) {
      case 'reported':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleAcknowledge(incident.id)}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded disabled:opacity-50"
            >
              ✓ {t('incident.acknowledge')}
            </button>
            <button
              onClick={() => openAssignModal(incident)}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50"
            >
              👤 {t('incident.assign')}
            </button>
          </div>
        )
      case 'acknowledged':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => openAssignModal(incident)}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50"
            >
              👤 {t('incident.assign')}
            </button>
            <button
              onClick={() => handleStartWork(incident.id)}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded disabled:opacity-50"
            >
              ▶️ {t('incident.startWork')}
            </button>
          </div>
        )
      case 'in_progress':
        return (
          <button
            onClick={() => handleResolve(incident.id)}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded disabled:opacity-50"
          >
            ✅ {t('incident.resolve')}
          </button>
        )
      case 'resolved':
        return (
          <button
            onClick={() => handleClose(incident.id)}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            📋 {t('incident.close')}
          </button>
        )
      default:
        return <span className="text-gray-400 text-sm">—</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('incident.title')}</h1>
          <p className="text-gray-600 mt-1">{t('incident.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{t('common.all')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-600">{t('incident.reported')}</p>
            <p className="text-2xl font-bold text-red-700">{stats.reported}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-600">{t('incident.acknowledged')}</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.acknowledged}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600">{t('incident.inProgress')}</p>
            <p className="text-2xl font-bold text-blue-700">{stats.in_progress}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-600">{t('incident.resolved')}</p>
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('common.all')}</option>
                <option value="reported">{t('incident.reported')}</option>
                <option value="acknowledged">{t('incident.acknowledged')}</option>
                <option value="in_progress">{t('incident.inProgress')}</option>
                <option value="resolved">{t('incident.resolved')}</option>
                <option value="closed">{t('incident.closed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.severity')}</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('common.all')}</option>
                <option value="critical">{t('incident.critical')}</option>
                <option value="high">{t('incident.high')}</option>
                <option value="medium">{t('incident.medium')}</option>
                <option value="low">{t('incident.low')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.type')}</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t('common.all')}</option>
                {types.map(t_type => (
                  <option key={t_type} value={t_type}>{t(`incident.${t_type}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('schedule.date')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('schedule.date')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMyIncidents}
                  onChange={(e) => setFilterMyIncidents(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t('incident.myIncidents') || 'Mis Incidentes'}
              </label>
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('incident.tour')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.severity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('incident.guide')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.assignedTo')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.created')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg">{getTypeIcon(incident.type)}</span>
                      <span className="ml-2 text-sm text-gray-900">{t(`incident.${incident.type}`)}</span>
                      {getEscalationBadge(incident.escalation_level)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{incident.tour_name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{incident.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
                        {t(`incident.${incident.severity}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                        {getStatusBadge(incident.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.guide_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.assigned_to_name || t('common.unassigned')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderActionButton(incident)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('common.noResults') || 'No incidents found matching your filters'}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t('incident.assign')} - {selectedIncident.tour_name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('incident.assignTo')}
              </label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">{t('incident.selectStaff')}</option>
                {availableStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAssign}
                disabled={!assignTo || actionLoading !== ''}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {t('incident.assign')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
