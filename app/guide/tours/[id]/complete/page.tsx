'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

const weatherOptions = [
  { value: 'sunny', label: '☀️ Sunny', icon: '☀️' },
  { value: 'partly_cloudy', label: '⛅ Partly Cloudy', icon: '⛅' },
  { value: 'cloudy', label: '☁️ Cloudy', icon: '☁️' },
  { value: 'rain', label: '🌧️ Rain', icon: '🌧️' },
  { value: 'storm', label: '⛈️ Storm', icon: '⛈️' },
]

const guestSatisfactionOptions = [
  { value: 'excellent', label: '😍 Excellent - Guests loved it!', color: 'bg-green-100 text-green-700' },
  { value: 'good', label: '🙂 Good - Happy guests', color: 'bg-blue-100 text-blue-700' },
  { value: 'average', label: '😐 Average - It was okay', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'poor', label: '😕 Poor - Issues occurred', color: 'bg-orange-100 text-orange-700' },
  { value: 'terrible', label: '😡 Terrible - Complaints', color: 'bg-red-100 text-red-700' },
]

const incidentOptions = [
  { value: 'none', label: '✅ No incidents' },
  { value: 'minor_delay', label: '⏱️ Minor delay' },
  { value: 'vehicle_issue', label: '🚐 Vehicle issue' },
  { value: 'guest_issue', label: '👥 Guest issue' },
  { value: 'medical', label: '🏥 Medical incident' },
  { value: 'weather', label: '🌧️ Weather related' },
  { value: 'other', label: '📝 Other' },
]

export default function CompleteTourPage() {
  const params = useParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [tour, setTour] = useState<{id: string; status: string; acknowledged_at: string | null} | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [weather, setWeather] = useState('sunny')
  const [guestSatisfaction, setGuestSatisfaction] = useState('excellent')
  const [incident, setIncident] = useState('none')
  const [guestCount, setGuestCount] = useState('')
  const [highlights, setHighlights] = useState('')
  const [issues, setIssues] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  
  // Cash reconciliation
  const [cashReceived, setCashReceived] = useState('')
  const [cashSpent, setCashSpent] = useState('')
  const [expenseReceipts, setExpenseReceipts] = useState<string[]>([])
  const [ticketCount, setTicketCount] = useState('')
  const [vehicleCheck, setVehicleCheck] = useState({
    forgottenItems: false,
    notes: ''
  })

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Silently fail
      )
    }
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, status, acknowledged_at')
      .eq('id', params.id)
      .single()
    
    if (tourData) {
      setTour(tourData)
      
      // Enforce wizard order: must acknowledge first
      if (!tourData.acknowledged_at) {
        router.push(`/guide/tours/${params.id}/acknowledge`)
        return
      }
      
      // Enforce wizard order: must be in_progress to complete
      if (tourData.status !== 'in_progress') {
        router.push(`/guide/tours/${params.id}`)
        return
      }
    }
    setLoading(false)
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      if (url) {
        setPhotos((prev: string[]) => [...prev, url as string])
      }
    } catch (err) {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Not authenticated')
      setSubmitting(false)
      return
    }

    // Get tour data for brand_id
    const { data: tourData } = await supabase
      .from('tours')
      .select('brand_id')
      .eq('id', params.id)
      .single()

    // Create office_return checkin
    if (tourData) {
      await supabase
        .from('guide_checkins')
        .insert({
          tour_id: params.id,
          brand_id: tourData.brand_id,
          guide_id: user.id,
          checkin_type: 'office_return',
          checked_in_at: new Date().toISOString(),
          latitude: location?.lat,
          longitude: location?.lng,
        })
    }

    const { error } = await supabase
      .from('tours')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        report_weather: weather,
        report_guest_satisfaction: guestSatisfaction,
        report_incident: incident,
        report_guest_count: guestCount ? parseInt(guestCount) : null,
        report_highlights: highlights,
        report_issues: issues,
        report_photos: photos,
        // Cash reconciliation
        report_cash_received: cashReceived ? parseFloat(cashReceived) : null,
        report_cash_spent: cashSpent ? parseFloat(cashSpent) : null,
        report_cash_to_return: cashReceived && cashSpent ? parseFloat(cashReceived) - parseFloat(cashSpent) : null,
        report_ticket_count: ticketCount ? parseInt(ticketCount) : null,
        report_expense_receipts: expenseReceipts,
        // Vehicle check
        report_forgotten_items: vehicleCheck.forgottenItems,
        report_forgotten_items_notes: vehicleCheck.notes,
      })
      .eq('id', params.id)

    if (error) {
      alert('Failed to complete tour: ' + error.message)
    } else {
      router.push('/guide')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 pb-24">
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">End of Tour Report</h1>
            <p className="text-blue-100 text-sm mt-1">Quickly document how the tour went</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Weather */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">How was the weather?</label>
              <div className="grid grid-cols-2 gap-2">
                {weatherOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWeather(opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      weather === opt.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mr-2">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Satisfaction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">How satisfied were the guests?</label>
              <div className="space-y-2">
                {guestSatisfactionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGuestSatisfaction(opt.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      guestSatisfaction === opt.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mr-2 ${opt.color}`}>
                      {opt.label.split(' ')[0]}
                    </span>
                    <span className="text-sm text-gray-700">{opt.label.split(' - ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How many guests attended?</label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="Enter number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>

            {/* Incidents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Any incidents?</label>
              <select
                value={incident}
                onChange={(e) => setIncident(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              >
                {incidentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tour Highlights / Summary</label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="What made the tour special? Any memorable moments?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Issues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Any issues or concerns?</label>
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="Describe any problems that occurred..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Photo Uploads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Add photos from the tour (optional)</label>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img src={photo} alt={`Tour photo ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-xs text-gray-500 mt-1">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">{photos.length}/6 photos added</p>
            </div>

            {/* Cash Reconciliation */}
            <div className="bg-blue-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">💵 Cash Reconciliation</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Received ($)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Spent ($)</label>
                  <input
                    type="number"
                    value={cashSpent}
                    onChange={(e) => setCashSpent(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {cashReceived && cashSpent && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600">Cash to Return:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(parseFloat(cashReceived) - parseFloat(cashSpent)).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Count</label>
                <input
                  type="number"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(e.target.value)}
                  placeholder="Number of tickets collected"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Receipts</label>
                <div className="grid grid-cols-3 gap-2">
                  {expenseReceipts.map((receipt, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img src={receipt} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setExpenseReceipts(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {expenseReceipts.length < 3 && (
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <span className="text-2xl">🧾</span>
                      <span className="text-xs text-gray-500 mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setUploading(true)
                            uploadToCloudinary(e.target.files[0]).then(url => {
                              if (url) setExpenseReceipts(prev => [...prev, url])
                              setUploading(false)
                            })
                          }
                        }}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Check */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">🚐 Vehicle Check</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleCheck.forgottenItems}
                  onChange={(e) => setVehicleCheck(prev => ({ ...prev, forgottenItems: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-gray-700">Forgotten items found in vehicle</span>
              </label>

              {vehicleCheck.forgottenItems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe items:</label>
                  <textarea
                    value={vehicleCheck.notes}
                    onChange={(e) => setVehicleCheck(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="What was left behind?"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Saving...' : 'Submit Report & Complete Tour'}
            </button>
          </form>
        </div>
      </div>
      {/* Extra bottom padding for mobile nav bar */}
      <div className="h-24"></div>
    </div>
  )
}
