'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface DemoStats {
  tours: number
  guests: number
  pickup_stops: number
  checkins: number
  incidents: number
  expenses: number
  feedback: number
  activity: number
  vehicles: number
}

export default function SuperAdminDemoPage() {
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStats, setDemoStats] = useState<DemoStats>({
    tours: 0, guests: 0, pickup_stops: 0, checkins: 0, incidents: 0, expenses: 0, feedback: 0, activity: 0, vehicles: 0
  })
  const [demoMessage, setDemoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadDemoStats()
  }, [])

  async function loadDemoStats() {
    const tables = ['tours', 'guests', 'pickup_stops', 'guide_checkins', 'incidents', 'tour_expenses', 'guest_feedback', 'activity_feed', 'vehicles']
    const stats: any = {}
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) console.error(`Failed to count ${table}:`, error)
      stats[table] = count || 0
    }
    
    setDemoStats({
      tours: stats.tours || 0,
      guests: stats.guests || 0,
      pickup_stops: stats.pickup_stops || 0,
      checkins: stats.guide_checkins || 0,
      incidents: stats.incidents || 0,
      expenses: stats.tour_expenses || 0,
      feedback: stats.guest_feedback || 0,
      activity: stats.activity_feed || 0,
      vehicles: stats.vehicles || 0
    })
  }

  async function handleClearDemoData() {
    if (!confirm('⚠️ DANGER: This will delete ALL demo data!\n\nThis will remove:\n- All tours created today\n- All guests\n- All guide check-ins\n- All pickup stops\n- All incidents\n- All tour expenses\n- All checklist completions\n- All guest feedback\n- All activity feed entries\n- All vehicles\n\nUsers/auth, brands, companies will be preserved.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const { data: results, error } = await supabase.rpc('clear_demo_data')
      
      if (error) throw new Error(`Failed to clear demo data: ${error.message}`)
      
      setDemoMessage({ type: 'success', text: `✅ Cleared demo data successfully!` })
      loadDemoStats()
    } catch (error: any) {
      setDemoMessage({ type: 'error', text: `❌ Error: ${error.message}` })
    } finally {
      setDemoLoading(false)
    }
  }

  async function handleGenerateDemoData() {
    if (!confirm('Generate demo data?\n\nThis will create:\n- 15 tours\n- 40 guests\n- 20 pickup stops\n- 15 guide check-ins\n- 3 incidents\n- 5 expenses\n- 3 feedback entries\n- 5 activity feed entries\n- 6 vehicles\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const { data: results, error } = await supabase.rpc('generate_demo_data')
      
      if (error) throw new Error(`Failed to generate demo data: ${error.message}`)
      
      setDemoMessage({ type: 'success', text: `✅ Generated demo data successfully!` })
      loadDemoStats()
    } catch (error: any) {
      setDemoMessage({ type: 'error', text: `❌ Error: ${error.message}` })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Demo Management</h1>
          
          {demoMessage && (
            <div className={`mb-6 p-4 rounded-lg ${demoMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {demoMessage.text}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Clear Demo Data */}
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🗑️</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Clear Demo Data</h3>
                  <p className="text-sm text-gray-500">Reset for client trial</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Removes all demo data (guests, check-ins, incidents, expenses, feedback) while preserving users, tours, and configuration.
              </p>
              <button
                onClick={handleClearDemoData}
                disabled={demoLoading}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {demoLoading ? 'Clearing...' : '🗑️ Clear All Demo Data'}
              </button>
            </div>

            {/* Generate Demo Data */}
            <div className="bg-white rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">📦</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Generate Demo Data</h3>
                  <p className="text-sm text-gray-500">Populate with sample data</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Creates realistic demo data including tours, guests, check-ins, incidents, expenses, and feedback for testing and demos.
              </p>
              <button
                onClick={handleGenerateDemoData}
                disabled={demoLoading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {demoLoading ? 'Generating...' : '📦 Generate Demo Data'}
              </button>
            </div>
          </div>

          {/* Current Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Demo Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{demoStats.tours}</div>
                <div className="text-sm text-gray-600">Tours</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{demoStats.guests}</div>
                <div className="text-sm text-gray-600">Guests</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{demoStats.checkins}</div>
                <div className="text-sm text-gray-600">Check-ins</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{demoStats.incidents}</div>
                <div className="text-sm text-gray-600">Incidents</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{demoStats.expenses}</div>
                <div className="text-sm text-gray-600">Expenses</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{demoStats.feedback}</div>
                <div className="text-sm text-gray-600">Feedback</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{demoStats.vehicles}</div>
                <div className="text-sm text-gray-600">Vehicles</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{demoStats.pickup_stops}</div>
                <div className="text-sm text-gray-600">Stops</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{demoStats.activity}</div>
                <div className="text-sm text-gray-600">Activity</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
