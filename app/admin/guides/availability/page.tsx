'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface GuideSchedule {
  id: string
  guide_id: string
  schedule_date: string
  is_available: boolean
  start_time?: string
  end_time?: string
  notes?: string
}

interface TimeOffRequest {
  id: string
  guide_id: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  requested_at: string
}

export default function GuideAvailabilityPage() {
  const [loading, setLoading] = useState(true)
  const [guides, setGuides] = useState<Guide[]>([])
  const [schedules, setSchedules] = useState<GuideSchedule[]>([])
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // Load guides
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .eq('role', 'guide')
      .eq('status', 'active')
      .order('last_name')

    if (guidesData) setGuides(guidesData)

    // Load schedules for selected date
    const { data: schedulesData } = await supabase
      .from('guide_schedules')
      .select('*')
      .eq('schedule_date', selectedDate)

    if (schedulesData) setSchedules(schedulesData)

    // Load pending time-off requests
    const { data: requestsData } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (requestsData) setTimeOffRequests(requestsData)

    setLoading(false)
  }

  async function toggleAvailability(guideId: string) {
    const existing = schedules.find(s => s.guide_id === guideId && s.schedule_date === selectedDate)

    if (existing) {
      // Toggle
      await supabase
        .from('guide_schedules')
        .update({ is_available: !existing.is_available })
        .eq('id', existing.id)
    } else {
      // Create new
      await supabase
        .from('guide_schedules')
        .insert({
          guide_id: guideId,
          schedule_date: selectedDate,
          is_available: true,
        })
    }

    loadData()
  }

  async function approveTimeOff(id: string) {
    await supabase
      .from('time_off_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)

    loadData()
  }

  async function denyTimeOff(id: string) {
    await supabase
      .from('time_off_requests')
      .update({ status: 'denied', reviewed_at: new Date().toISOString() })
      .eq('id', id)

    loadData()
  }

  async function submitTimeOffRequest() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    await supabase
      .from('time_off_requests')
      .insert({
        guide_id: session.user.id,
        start_date: newRequest.start_date,
        end_date: newRequest.end_date,
        reason: newRequest.reason,
        status: 'pending',
      })

    setShowRequestModal(false)
    setNewRequest({ start_date: '', end_date: '', reason: '' })
    loadData()
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guide Availability</h1>
          <p className="text-gray-500 mt-1">Manage guide schedules and time-off requests</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Request Time Off
        </button>
      </div>

      {/* Time-off requests */}
      {timeOffRequests.length > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Time-Off Requests</h2>
          <div className="space-y-4">
            {timeOffRequests.map((request) => {
              const guide = guides.find(g => g.id === request.guide_id)
              return (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {guide?.first_name} {guide?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.start_date} → {request.end_date}
                    </p>
                    <p className="text-sm text-gray-500">{request.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveTimeOff(request.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => denyTimeOff(request.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Availability calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              loadData()
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="space-y-3">
          {guides.map((guide) => {
            const schedule = schedules.find(s => s.guide_id === guide.id && s.schedule_date === selectedDate)
            const isAvailable = schedule?.is_available ?? false

            return (
              <div key={guide.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {guide.first_name} {guide.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{guide.email}</p>
                </div>
                <button
                  onClick={() => toggleAvailability(guide.id)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isAvailable
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {isAvailable ? '✓ Available' : '✗ Unavailable'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time-off request modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Request Time Off</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newRequest.start_date}
                  onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newRequest.end_date}
                  onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Vacation, illness, personal..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={submitTimeOffRequest}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
