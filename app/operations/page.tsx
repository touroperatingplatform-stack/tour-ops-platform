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

interface Vehicle {
  id: string
  plate_number: string
  make: string
  model: string
  status: 'available' | 'in_use' | 'maintenance'
}

export default function OperationsDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'vehicles'>('today')

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

      // Get vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model, status')
        .order('plate_number')

      setVehicles(vehiclesData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const scheduledTours = tours.filter(t => t.status === 'scheduled')
  const inProgressTours = tours.filter(t => t.status === 'in_progress')
  const completedTours = tours.filter(t => t.status === 'completed')
  
  const availableVehicles = vehicles.filter(v => v.status === 'available')
  const inUseVehicles = vehicles.filter(v => v.status === 'in_use')

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
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Operations Dashboard</h1>
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
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{scheduledTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Scheduled</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{inProgressTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>In Progress</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{completedTours.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Completed</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{availableVehicles.length}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>Vehicles Available</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('today')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'today' ? '#2563eb' : '#e5e7eb',
              color: activeTab === 'today' ? 'white' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Today's Tours
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'vehicles' ? '#2563eb' : '#e5e7eb',
              color: activeTab === 'vehicles' ? 'white' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Vehicles
          </button>
        </div>

        {/* Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px' }}>
          {activeTab === 'today' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Today's Schedule</h2>
              {tours.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No tours scheduled today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tours.map((tour) => (
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
                            ⏰ {tour.start_time} | 📍 {tour.pickup_location || 'TBD'}
                          </p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            👤 {tour.guide?.first_name} {tour.guide?.last_name} | 🚐 {tour.vehicle?.plate_number || 'Unassigned'}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: 
                            tour.status === 'in_progress' ? '#dbeafe' : 
                            tour.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                          color: 
                            tour.status === 'in_progress' ? '#1d4ed8' : 
                            tour.status === 'completed' ? '#166534' : '#6b7280',
                          textTransform: 'capitalize',
                        }}>
                          {tour.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Fleet Status</h2>
              {vehicles.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No vehicles found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '600', margin: 0 }}>{vehicle.plate_number}</p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {vehicle.make} {vehicle.model}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: 
                            vehicle.status === 'available' ? '#dcfce7' : 
                            vehicle.status === 'in_use' ? '#dbeafe' : '#fee2e2',
                          color: 
                            vehicle.status === 'available' ? '#166534' : 
                            vehicle.status === 'in_use' ? '#1d4ed8' : '#991b1b',
                          textTransform: 'capitalize',
                        }}>
                          {vehicle.status.replace('_', ' ')}
                        </span>
                      </div>
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
