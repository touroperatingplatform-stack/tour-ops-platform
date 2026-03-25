'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  description: string
  tour_date: string
  start_time: string
  pickup_location: string
  dropoff_location: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  vehicle_id?: string
  guest_count: number
  capacity: number
}

interface Vehicle {
  plate_number: string
  make: string
  model: string
}

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  required: boolean
}

export default function TourChecklistPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [loading, setLoading] = useState(true)
  const [tour, setTour] = useState<Tour | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'cooler', text: 'Cooler box with drinks', checked: false, required: true },
    { id: 'equipment', text: 'Equipment checklist complete', checked: false, required: true },
    { id: 'pettycash', text: 'Petty cash verified', checked: false, required: true },
    { id: 'vehicle', text: 'Vehicle inspection photos taken', checked: false, required: true },
    { id: 'arrival', text: 'Arrived at pickup 20 min early', checked: false, required: true },
  ])
  const [showCamera, setShowCamera] = useState(false)
  const [activePhotoStep, setActivePhotoStep] = useState(0)

  const photoSteps = [
    { id: 'front', label: 'Front of vehicle', description: 'License plate visible' },
    { id: 'interior', label: 'Interior', description: 'Seats and cleanliness' },
    { id: 'damage', label: 'Any damage', description: 'Mark existing scratches/dents' },
  ]

  useEffect(() => {
    loadTour()
  }, [tourId])

  async function loadTour() {
    const { data } = await supabase
      .from('tours')
      .select('*, vehicle:vehicle_id(plate_number, make, model)')
      .eq('id', tourId)
      .single()

    if (data) {
      setTour(data)
      setVehicle(data.vehicle)
    }
    setLoading(false)
  }

  function toggleChecklistItem(id: string) {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  async function handlePhotoCapture() {
    // In real app, this would open camera
    // For now, just mark as complete
    setActivePhotoStep(prev => {
      if (prev < photoSteps.length - 1) return prev + 1
      setShowCamera(false)
      toggleChecklistItem('vehicle')
      return 0
    })
  }

  async function startTour() {
    const allRequired = checklist
      .filter(item => item.required)
      .every(item => item.checked)
    
    if (!allRequired) {
      alert('Please complete all required checklist items')
      return
    }

    await supabase
      .from('tours')
      .update({ status: 'in_progress' })
      .eq('id', tourId)

    router.push(`/guide/tours/${tourId}`)
  }

  function getProgress() {
    const checked = checklist.filter(i => i.checked).length
    return Math.round((checked / checklist.length) * 100)
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <Link href="/guide" className="text-gray-600">
            ← Back
          </Link>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            tour?.status === 'in_progress' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {tour?.status === 'in_progress' ? 'Live' : 'Pre-tour'}
          </span>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Tour Info Card */}
        <div className="bg-blue-600 rounded-2xl p-5 text-white">
          <h1 className="text-xl font-bold mb-2">{tour?.name}</h1>
          <div className="flex items-center gap-4 text-blue-100">
            <span>🕐 {tour?.start_time?.slice(0, 5)}</span>
            <span>👥 {tour?.guest_count}/{tour?.capacity}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-500">
            <p className="text-sm text-blue-100">Pickup: {tour?.pickup_location}</p>
          </div>
        </div>

        {/* Vehicle Card */}
        {vehicle && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  🚐
                </div>
                <div>
                  <p className="font-bold text-gray-900">{vehicle.plate_number}</p>
                  <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Pre-tour Checklist</span>
            <span className="text-blue-600 font-bold">{getProgress()}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'vehicle') {
                  setShowCamera(true)
                } else {
                  toggleChecklistItem(item.id)
                }
              }}
              className={`w-full bg-white rounded-2xl p-4 border-2 text-left transition-all ${
                item.checked 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                  item.checked ? 'bg-green-500 text-white' : 'bg-gray-100'
                }`}
                >
                  {item.checked ? '✓' : item.id === 'vehicle' ? '📸' : '○'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${item.checked ? 'text-green-900' : 'text-gray-900'}`}>
                    {item.text}
                  </p>
                  {item.required && !item.checked && (
                    <p className="text-xs text-red-500 mt-0.5">Required</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Start Tour Button */}
        {tour?.status === 'scheduled' && (
          <button
            onClick={startTour}
            disabled={getProgress() < 100}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              getProgress() === 100
                ? 'bg-green-600 text-white shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {getProgress() === 100 ? '🚀 Start Tour' : `Complete checklist (${getProgress()}%)`}
          </button>
        )}
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-white px-4 py-3 flex items-center justify-between">
            <span className="font-bold">Vehicle Inspection</span>
            <button onClick={() => setShowCamera(false)} className="text-gray-600">✕</button>
          </div>
          
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-6xl mb-4">📸</p>
              <p className="text-xl font-bold mb-2">{photoSteps[activePhotoStep].label}</p>
              <p className="text-gray-400">{photoSteps[activePhotoStep].description}</p>
            </div>
          </div>
          
          <div className="bg-white p-4">
            <div className="flex justify-center gap-2 mb-4">
              {photoSteps.map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === activePhotoStep ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              ))}
            </div>
            
            <button
              onClick={handlePhotoCapture}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold"
            >
              {activePhotoStep < photoSteps.length - 1 ? 'Next Photo' : 'Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
