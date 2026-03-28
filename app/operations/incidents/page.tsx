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
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
  description: string
  created_at: string
  guide_name: string
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
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('id, type, severity, status, description, created_at, guide_id, assigned_to, escalation_level, tour_id')
      .order('created_at', { ascending: false })

    if (!incidentsData) {
      setLoading(false)
      return
    }

    // Fetch related data
    const tourIds = [...new Set(incidentsData.map(i => i.tour_id).filter(Boolean))]
    const guideIds = [...new Set(incidentsData.map(i => i.guide_id).filter(Boolean))]
    const assigneeIds = [...new Set(incidentsData.map(i => i.assigned_to).filter(Boolean))]

    const { data: tours } = await supabase.from('tours').select('id, name').in('id', tourIds.length > 0 ? tourIds : ['00000000-0000-0000-0000-000000000000'])
    const { data: guides } = await supabase.from('profiles').select('id, first_name, last_name').in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])
    const { data: assignees } = await supabase.from('profiles').select('id, first_name, last_name').in('id', assigneeIds.length > 0 ? assigneeIds : ['00000000-0000-0000-0000-000000000000'])

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
      assigned_to_name: i.assigned_to ? assigneeMap.get(i.assigned_to) : undefined,
      escalation_level: i.escalation_level || 0
    }))

    setIncidents(formatted)
    setLoading(false)
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

  const filtered = incidents.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
    if (filterType !== 'all' && i.type !== filterType) return false
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading incidents...</div>
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                      {incident.escalation_level > 0 && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{t('incident.level')}{incident.escalation_level}</span>
                      )}
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
                        {t(`incident.${incident.status}`)}
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
                      <Link
                        href={`/operations/incidents/${incident.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.view')} →
                      </Link>
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
    </div>
  )
}
