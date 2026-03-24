'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import IncidentReportForm from '@/components/IncidentReportForm'

interface Tour {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  pickup_location: string
  dropoff_location: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  vehicle_id?: string
  vehicle: { plate_number: string; make: string; model: string; capacity: number } | null
}

interface ChecklistItem {
  id: string
  stage: string
  label: string
  description: string | null
  requires_photo: boolean
  requires_gps: boolean
  requires_selfie: boolean
  completed: boolean
}

export default function TourDetailPage() {
  const params = useParams()
  const tourId = params.id as string
  
  const [tour, setTour] = useState<Tour | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showIncidentForm, setShowIncidentForm] = useState(false)

  useEffect(() => {
    async function loadTour() {
      const { data: tourData } = await supabase
        .from('tours')
        .select(`
          id, name, description, start_time, end_time,
          pickup_location, dropoff_location, status, vehicle_id
        `)
        .eq('id', tourId)
        .single()

      if (tourData) {
        // Get vehicle data separately
        let vehicle = null
        if (tourData.vehicle_id) {
          const { data: v } = await supabase
            .from('vehicles')
            .select('plate_number, make, model, capacity')
            .eq('id', tourData.vehicle_id)
            .single()
          vehicle = v
        }
        setTour({ ...tourData, vehicle })
      }

      // Load checklist templates
      const { data: templates } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (templates) {
        setChecklist(templates.map(t => ({
          ...t,
          completed: false,
        })))
      }

      setLoading(false)
    }

    loadTour()
  }, [tourId])

  async function updateStatus(newStatus: string) {
    await supabase
      .from('tours')
      .update({ status: newStatus })
      .eq('id', tourId)
    
    setTour(prev => prev ? { ...prev, status: newStatus as any } : null)
  }

  async function toggleChecklistItem(itemId: string) {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
        <p>Loading tour...</p>
      </div>
    )
  }

  if (!tour) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
        <p>Tour not found</p>
        <Link href="/guide" style={{ color: '#2563eb' }}>Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#111827',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/guide" style={{ color: 'white', textDecoration: 'none' }}>
          ← Back
        </Link>
        <span style={{ fontWeight: '500' }}>Tour Details</span>
        <div style={{ width: '50px' }}></div>
      </header>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Tour Info */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{tour.name}</h1>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: tour.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
              color: tour.status === 'in_progress' ? '#1d4ed8' : '#6b7280',
            }}>
              {tour.status}
            </span>
          </div>

          {tour.description && (
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>{tour.description}</p>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Start Time: </span>
              <span style={{ fontWeight: '500' }}>{tour.start_time}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Pickup: </span>
              <span style={{ fontWeight: '500' }}>{tour.pickup_location || 'TBD'}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Dropoff: </span>
              <span style={{ fontWeight: '500' }}>{tour.dropoff_location || 'TBD'}</span>
            </div>
            {tour.vehicle && (
              <div>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>Vehicle: </span>
                <span style={{ fontWeight: '500' }}>{tour.vehicle.plate_number} - {tour.vehicle.make} {tour.vehicle.model}</span>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {tour.status === 'scheduled' && (
              <Link
                href={`/guide/tours/${tour.id}/checklist`}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
              >
                📋 Pre-tour Checklist
              </Link>
            )}
            {tour.status === 'in_progress' && (
              <button
                onClick={() => updateStatus('completed')}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Complete Tour
              </button>
            )}
            <Link
              href={`/guide/tours/${tour.id}/guests`}
              style={{
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
              }}
            >
              👥 Guest List
            </Link>
            <Link
              href={`/guide/tours/${tour.id}/expenses`}
              style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-block',
              }}
            >
              💵 Expenses
            </Link>
            <button
              onClick={() => setShowIncidentForm(true)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              🚨 Report Incident
            </button>
          </div>
        </div>

        {/* Incident Form Modal */}
        {showIncidentForm && tour && (
          <IncidentReportForm
            tourId={tour.id}
            tourName={tour.name}
            onClose={() => setShowIncidentForm(false)}
            onSuccess={() => {
              setShowIncidentForm(false)
              alert('Incident reported! Supervisors have been notified.')
            }}
          />
        )}

        {/* Checklist */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>Checklist</h2>

          {checklist.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No checklist items configured</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: item.completed ? '#f0fdf4' : '#f9fafb',
                    borderRadius: '8px',
                    border: item.completed ? '1px solid #86efac' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: item.completed ? 'none' : '2px solid #d1d5db',
                    backgroundColor: item.completed ? '#22c55e' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.completed && <span style={{ color: 'white' }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>{item.label}</p>
                    {item.description && (
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{item.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {item.requires_photo && <span style={{ fontSize: '12px', color: '#2563eb' }}>📷 Photo required</span>}
                      {item.requires_gps && <span style={{ fontSize: '12px', color: '#2563eb' }}>📍 GPS required</span>}
                      {item.requires_selfie && <span style={{ fontSize: '12px', color: '#2563eb' }}>🤳 Selfie required</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
