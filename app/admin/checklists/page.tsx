'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface ChecklistItem {
  id: string
  stage: string
  label: string
  is_mandatory: boolean
}

const stageIcons: Record<string, string> = {
  pre_departure: '🚗',
  pre_pickup: '👋',
  dropoff: '🏨',
  finish: '✅'
}

const stageLabels: Record<string, string> = {
  pre_departure: 'Pre-Departure',
  pre_pickup: 'Pre-Pickup',
  dropoff: 'Dropoff',
  finish: 'Finish'
}

export default function ChecklistsPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [stats, setStats] = useState({ total: 0, mandatory: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChecklists()
  }, [])

  async function loadChecklists() {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('id, stage, label, is_mandatory')
      .order('stage')

    if (error) {
      console.error('Error loading checklists:', error)
    } else {
      setItems(data || [])
      setStats({
        total: data?.length || 0,
        mandatory: data?.filter((i: ChecklistItem) => i.is_mandatory).length || 0
      })
    }
    setLoading(false)
  }

  // Group by stage
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = []
    acc[item.stage].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading checklists...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Checklists</h1>
            <p className="text-gray-500 text-sm">Tour checkpoints</p>
          </div>
          <Link 
            href="/admin/checklists/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-xs">Total Items</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.mandatory}</div>
            <div className="text-gray-500 text-xs">Mandatory</div>
          </div>
        </div>
      </div>

      {/* Checklist Groups */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-4">
          {Object.entries(grouped).map(([stage, stageItems]) => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stageIcons[stage] || '📝'}</span>
                <span className="font-semibold">{stageLabels[stage] || stage}</span>
                <span className="text-gray-400 text-sm">({stageItems.length})</span>
              </div>
              
              <div className="space-y-2">
                {stageItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={false} readOnly className="w-5 h-5" />
                      <span className={item.is_mandatory ? 'font-medium' : 'text-gray-600'}>
                        {item.label}
                      </span>
                    </div>
                    {item.is_mandatory && (
                      <span className="text-xs text-red-500">*Required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          <Link href="/admin" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/tours" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">🚌</span>
            <span className="text-xs">Tours</span>
          </Link>
          <Link href="/admin/checklists" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">☑️</span>
            <span className="text-xs">Checklists</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center text-gray-400">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
