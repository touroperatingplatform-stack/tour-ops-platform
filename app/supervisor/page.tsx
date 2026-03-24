'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Tour {
  id: string
  name: string
  start_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickup_location: string
  guide: { first_name: string; last_name: string } | null
  vehicle: { plate_number: string } | null
}

interface Guide {
  id: string
  first_name: string
  last_name: string
  is_active: boolean
}

export default function SupervisorDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'guides'>('live')

  useEffect(() => {
    async function loadData() {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's tours
      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id, name, start_time, status, pickup_location, guide_id, vehicle_id
        `)
        .eq('tour_date', today)
        .order('start_time')

      // Get guides and vehicles separately
      const toursWithData = await Promise.all((toursData || []).map(async (tour: any) => {
        let guide = null
        let vehicle = null
        
        if (tour.guide_id) {
          const { data: g } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', tour.guide_id)
            .single()
          guide = g
        }
        
        if (tour.vehicle_id) {
          const { data: v } = await supabase
            .from('vehicles')
            .select('plate_number')
            .eq('id', tour.vehicle_id)
            .single()
          vehicle = v
        }
        
        return { ...tour, guide, vehicle }
      }))

      setTours(toursWithData)

      // Get active guides
      const { data: guidesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_active')
        .eq('role', 'guide')
        .eq('is_active', true)

      setGuides(guidesData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const liveTours = tours.filter(t => t.status === 'in_progress')
  const todayTours = tours
  const completedTours = tours.filter(t => t.status === 'completed')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <p>Loading...</p>
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
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Supervisor Dashboard</h1>
        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: 'transparent',
            color: '#9ca3af',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Stats */}
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{liveTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Live Tours</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{todayTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Today's Tours</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{completedTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Completed</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{guides.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Active Guides</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['live', 'today', 'guides'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab ? '#2563eb' : '#e5e7eb',
                color: activeTab === tab ? 'white' : '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px' }}>
          {activeTab === 'live' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Live Tours</h2>
              {liveTours.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No tours currently in progress</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {liveTours.map((tour) => (
                    <div key={tour.id} style={{
                      padding: '16px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '8px',
                      border: '1px solid #3b82f6',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '600', margin: 0 }}>{tour.name}</p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            Guide: {tour.guide?.first_name} {tour.guide?.last_name} | Vehicle: {tour.vehicle?.plate_number || 'N/A'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '12px',
                        }}>
                          LIVE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'today' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Today's Schedule</h2>
              {todayTours.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No tours scheduled today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todayTours.map((tour) => (
                    <div key={tour.id} style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '600', margin: 0 }}>{tour.name}</p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {tour.start_time} | {tour.pickup_location || 'TBD'}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: tour.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                          color: tour.status === 'completed' ? '#166534' : '#6b7280',
                          borderRadius: '20px',
                          fontSize: '12px',
                          textTransform: 'capitalize',
                        }}>
                          {tour.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guides' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Active Guides</h2>
              {guides.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No guides found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {guides.map((guide) => (
                    <div key={guide.id} style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <p style={{ fontWeight: '500', margin: 0 }}>{guide.first_name} {guide.last_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
