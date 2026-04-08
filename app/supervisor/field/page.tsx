'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { getLocalDate } from '@/lib/timezone'

interface Tour {
  id: string
  name: string
  start_time: string
  status: string
  guest_count: number
  guide_id: string
  guide: {
    first_name: string
    last_name: string
  }
}

interface Incident {
  id: string
  tour_name: string
  type: string
  severity: string
}

export default function SupervisorFieldView() {
  const [tours, setTours] = useState<Tour[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const today = getLocalDate()
    const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]

    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser()
    let companyId = null
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      companyId = profile?.company_id
    }

    // Load tours for this company
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, name, start_time, status, guest_count, guide_id')
      .in('tour_date', [today, tomorrow])
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .order('start_time')

    if (toursData) {
      const guideIds = [...new Set(toursData.map(t => t.guide_id).filter(Boolean))]
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guideIds.length > 0 ? guideIds : ['00000000-0000-0000-0000-000000000000'])

      const guideMap = new Map(guidesData?.map((g: any) => [g.id, g]) || [])

      // Get actual guest counts from reservation_manifest
      const { data: manifestData } = await supabase
        .from('reservation_manifest')
        .select('tour_id, total_pax')
        .in('tour_id', toursData.map(t => t.id))

      const guestCountMap = new Map()
      if (manifestData) {
        manifestData.forEach((row: any) => {
          const current = guestCountMap.get(row.tour_id) || 0
          guestCountMap.set(row.tour_id, current + (row.total_pax || 0))
        })
      }

      setTours(toursData.map((t: any) => ({
        ...t,
        guide: guideMap.get(t.guide_id) || { first_name: 'Unknown', last_name: '' },
        guest_count: guestCountMap.get(t.id) || t.guest_count || 0
      })))

      // Load incidents for this company's tours only
      const tourIds = toursData.map(t => t.id)
      if (tourIds.length > 0) {
        const { data: incidentsData } = await supabase
          .from('incidents')
          .select('id, type, severity, tour_id')
          .in('status', ['reported', 'acknowledged', 'in_progress'])
          .in('tour_id', tourIds)
          .order('created_at', { ascending: false })

        if (incidentsData && incidentsData.length > 0) {
          const tourMap = new Map(toursData.map((t: any) => [t.id, t.name]))

          setIncidents(incidentsData.map((i: any) => ({
            ...i,
            tour_name: tourMap.get(i.tour_id) || 'Unknown'
          })))
        } else {
          setIncidents([])
        }
      } else {
        setIncidents([])
      }
    } else {
      setTours([])
      setIncidents([])
    }

    setLoading(false)
  }

  const activeTours = tours.filter(t => t.status === 'in_progress')

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredRole="supervisor">
      <div className="h-full flex flex-col p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Field View</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link 
            href="/supervisor"
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Office View →
          </Link>
        </div>

        {/* Alerts */}
        {incidents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-bold text-red-800">{incidents.length} Need Attention</span>
              </div>
            </div>
            <div className="space-y-1">
              {incidents.slice(0, 3).map((incident) => (
                <div key={incident.id} className="text-sm text-red-700 flex items-center gap-2">
                  <span>•</span>
                  <span className="font-medium">{incident.tour_name}:</span>
                  <span>{incident.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Tours */}
        <div className="flex-1 space-y-3 overflow-auto">
          <div className="font-semibold text-gray-900">
            📍 Active Tours ({activeTours.length})
          </div>
          
          {activeTours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚌</span>
                  <span className="font-bold text-lg">{tour.name}</span>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {tour.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <span>👤</span>
                <span className="font-medium">{tour.guide.first_name} {tour.guide.last_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>👥 {tour.guest_count} guests</span>
                <span>•</span>
                <span>{tour.start_time?.slice(0, 5)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  View Details
                </button>
                <button className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-lg font-medium">
                  Report Issue
                </button>
              </div>
            </div>
          ))}
          
          {activeTours.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">✓</div>
              <p className="font-medium">No active tours</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-2">
          <Link 
            href="/supervisor/incidents/new"
            className="block w-full py-4 bg-red-600 text-white rounded-xl font-bold text-center"
          >
            🚨 Report Incident
          </Link>
          <button className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold">
            📋 Quick Note
          </button>
        </div>
      </div>
    </RoleGuard>
  )
}
