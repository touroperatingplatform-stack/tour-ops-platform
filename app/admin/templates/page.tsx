'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  duration_minutes: number
  capacity: number
  price: number
  is_active: boolean
}

export default function TourTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('tour_templates')
      .select('id, name, duration_minutes, capacity, price, is_active')
      .order('name')

    if (data) {
      setTemplates(data)
      setStats({
        total: data.length,
        active: data.filter((t: Template) => t.is_active).length
      })
    }
    setLoading(false)
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Templates</h1>
            <p className="text-gray-500 text-sm">Tour templates</p>
          </div>
          <Link 
            href="/admin/templates/new"
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
            <div className="text-gray-500 text-xs">Total</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-gray-500 text-xs">Active</div>
          </div>
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {templates.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              No templates yet
            </div>
          ) : (
            templates.map(template => (
              <Link
                key={template.id}
                href={`/admin/templates/${template.id}`}
                className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{template.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {formatDuration(template.duration_minutes)} • {template.capacity} guests
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="text-lg font-bold text-blue-600">
                  ${template.price}
                </div>
              </Link>
            ))
          )}
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
          <Link href="/admin/templates" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">📋</span>
            <span className="text-xs">Templates</span>
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
