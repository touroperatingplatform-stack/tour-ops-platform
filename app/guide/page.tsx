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
  vehicle: { plate_number: string; make: string; model: string } | null
}

export default function GuideDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)

      // Get today's tours for this guide
      const today = new Date().toISOString().split('T')[0]
      const { data: toursData } = await supabase
        .from('tours')
        .select(`
          id, name, start_time, status, pickup_location,
          vehicle:vehicles(plate_number, make, model)
        `)
        .eq('guide_id', session.user.id)
        .eq('tour_date', today)
        .order('start_time')

      setTours(toursData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Guide Dashboard</h1>
          {profile && (
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>
              {profile.first_name} {profile.last_name}
            </p>
          )}
        </div>
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

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Today's Tours</h2>

        {tours.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <p>No tours scheduled for today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/guide/tours/${tour.id}`}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  border: tour.status === 'in_progress' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                      {tour.name}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>
                      ⏰ {tour.start_time}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>
                      📍 {tour.pickup_location || 'Location TBD'}
                    </p>
                    {tour.vehicle && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                        🚐 {tour.vehicle.plate_number} - {tour.vehicle.make} {tour.vehicle.model}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: tour.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
                    color: tour.status === 'in_progress' ? '#1d4ed8' : '#6b7280',
                  }}>
                    {tour.status === 'scheduled' && 'Scheduled'}
                    {tour.status === 'in_progress' && 'In Progress'}
                    {tour.status === 'completed' && 'Completed'}
                    {tour.status === 'cancelled' && 'Cancelled'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
