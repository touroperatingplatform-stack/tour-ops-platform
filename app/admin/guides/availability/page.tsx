'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function GuideAvailabilityPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [availableToday, setAvailableToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    const today = getLocalDate()
    
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'guide')
      .eq('status', 'active')
      .order('first_name')

    if (data) {
      setGuides(data)
      // Would check availability from schedule table
      setAvailableToday(data.length) // Simplified
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading guides...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Guides</h1>
            <p className="text-gray-500 text-sm">Team availability</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{availableToday}/{guides.length}</div>
            <div className="text-gray-500 text-xs">Available</div>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <button
              key={day}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm ${
                i === 0 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Guide List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {guides.map(guide => (
            <div
              key={guide.id}
              className="bg-white rounded-xl shadow p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  🎯
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold">{guide.first_name} {guide.last_name}</h3>
                  <p className="text-gray-500 text-sm">{guide.email}</p>
                </div>
                
                <div className="text-right">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    Available
                  </span>
                </div>
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
          <Link href="/admin/guides/availability" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">🎯</span>
            <span className="text-xs">Guides</span>
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
