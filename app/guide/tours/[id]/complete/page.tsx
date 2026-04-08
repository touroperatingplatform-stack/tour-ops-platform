'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { compressImage } from '@/lib/image-compression'

const weatherOptions = [
  { value: 'sunny', label: 'Sunny', icon: '☀️' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: '⛅' },
  { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'storm', label: 'Storm', icon: '⛈️' },
]

const guestSatisfactionOptions = [
  { value: 'excellent', label: 'Excellent', icon: '😍', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'good', label: 'Good', icon: '🙂', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'average', label: 'Average', icon: '😐', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'poor', label: 'Poor', icon: '😕', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'terrible', label: 'Terrible', icon: '😡', color: 'bg-red-100 text-red-700 border-red-200' },
]

const incidentOptions = [
  { value: 'none', label: '✅ No incidents' },
  { value: 'minor_delay', label: '⏱️ Minor delay' },
  { value: 'vehicle_issue', label: '🚐 Vehicle issue' },
  { value: 'guest_issue', label: '👥 Guest issue' },
  { value: 'weather', label: '🌧️ Weather related' },
  { value: 'other', label: '📝 Other' },
]

export default function CompleteTourPage() {
  const params = useParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [tour, setTour] = useState<{id: string; name: string; status: string; acknowledged_at: string | null} | null>(null)
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
  
  // Cash
  const [cashReceived, setCashReceived] = useState('')
  const [cashSpent, setCashSpent] = useState('')
  const [ticketCount, setTicketCount] = useState('')
  const [vehicleCheck, setVehicleCheck] = useState({ forgottenItems: false, notes: '' })

  useEffect(() => {
    loadTour()
  }, [])

  async function loadTour() {
    const { data: tourData } = await supabase
      .from('tours')
      .select('id, name, status, acknowledged_at')
      .eq('id', params.id)
      .single()
    
    if (tourData) {
      setTour(tourData)
      
      if (!tourData.acknowledged_at) {
        router.push(`/guide/tours/${params.id}/acknowledge`)
        return
      }
      
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
      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxFileSizeMB: 2
      })

      console.log('Complete Tour photo compressed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      })

      const url = await uploadToCloudinary(compressedFile)
      if (url) setPhotos(prev => [...prev, url as string])
    } catch (err) {
      console.error('Photo upload error:', err)
      alert('Failed to upload photo. Please try again.')
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

    const { data: tourData } = await supabase
      .from('tours')
      .select('brand_id')
      .eq('id', params.id)
      .single()

    // Create office_return checkin
    if (tourData) {
      await supabase.from('guide_checkins').insert({
        tour_id: params.id,
        brand_id: tourData.brand_id,
        guide_id: user.id,
        checkin_type: 'office_return',
        checked_in_at: new Date().toISOString(),
      })
    }

    const { error } = await supabase.from('tours').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      report_weather: weather,
      report_guest_satisfaction: guestSatisfaction,
      report_incident: incident,
      report_guest_count: guestCount ? parseInt(guestCount) : null,
      report_highlights: highlights,
      report_issues: issues,
      report_photos: photos,
      report_cash_received: cashReceived ? parseFloat(cashReceived) : null,
      report_cash_spent: cashSpent ? parseFloat(cashSpent) : null,
      report_cash_to_return: cashReceived && cashSpent ? parseFloat(cashReceived) - parseFloat(cashSpent) : null,
      report_ticket_count: ticketCount ? parseInt(ticketCount) : null,
      report_forgotten_items: vehicleCheck.forgottenItems,
      report_forgotten_items_notes: vehicleCheck.notes,
    }).eq('id', params.id)

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

  const cashToReturn = cashReceived && cashSpent 
    ? (parseFloat(cashReceived) - parseFloat(cashSpent)).toFixed(2)
    : null

  return (
    <div>
      {/* Header */}
      <div className="bg-green-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/guide/tours/${params.id}`} className="text-white/80 hover:text-white">
            ← Back
          </Link>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            Final Step
          </span>
        </div>
        <h1 className="text-2xl font-bold">🏁 Complete Tour</h1>
        {tour && <p className="text-white/80 mt-1">{tour.name}</p>}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-40">
        {/* Weather */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">☀️ Weather</h3>
          <div className="grid grid-cols-3 gap-3">
            {weatherOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWeather(opt.value)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  weather === opt.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Satisfaction */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">😀 Guest Satisfaction</h3>
          <div className="grid grid-cols-2 gap-3">
            {guestSatisfactionOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGuestSatisfaction(opt.value)}
                className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  guestSatisfaction === opt.value 
                    ? opt.color + ' border-current' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Count */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">👥 Final Guest Count</h3>
          <input
            type="number"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            placeholder="Total guests who attended"
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        {/* Incidents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🚨 Incidents</h3>
          <select
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {incidentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">✨ Highlights</h3>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="What made the tour special?"
            rows={3}
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Issues */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">⚠️ Issues (optional)</h3>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="Any problems that occurred..."
            rows={2}
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📷 Tour Photos (optional)</h3>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
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
        </div>

        {/* Cash Reconciliation */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💵 Cash Reconciliation</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash Received</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash Spent</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={cashSpent}
                  onChange={(e) => setCashSpent(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {cashToReturn && (
            <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
              <p className="text-sm text-gray-500">Cash to Return</p>
              <p className="text-3xl font-bold text-blue-600">${cashToReturn}</p>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Count</label>
            <input
              type="number"
              value={ticketCount}
              onChange={(e) => setTicketCount(e.target.value)}
              placeholder="Number of tickets"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Vehicle Check */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🚐 Vehicle Check</h3>
          <button
            type="button"
            onClick={() => setVehicleCheck(prev => ({ ...prev, forgottenItems: !prev.forgottenItems }))}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              vehicleCheck.forgottenItems 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              vehicleCheck.forgottenItems ? 'bg-red-500 text-white' : 'bg-gray-200'
            }`}>
              {vehicleCheck.forgottenItems ? '✓' : '○'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Forgotten items</div>
              <div className="text-sm text-gray-500">Found items left in vehicle</div>
            </div>
          </button>
          
          {vehicleCheck.forgottenItems && (
            <textarea
              value={vehicleCheck.notes}
              onChange={(e) => setVehicleCheck(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Describe items found..."
              rows={2}
              className="w-full mt-3 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </form>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
            !submitting && !uploading
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <span className="animate-spin">⟳</span>
              Completing...
            </>
          ) : (
            <>
              <span className="text-xl">✓</span>
              COMPLETE TOUR
            </>
          )}
        </button>
      </div>
    </div>
  )
}
