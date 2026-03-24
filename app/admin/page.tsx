'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  totalUsers: number
  totalTours: number
  activeGuides: number
  openIncidents: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTours: 0,
    activeGuides: 0,
    openIncidents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const { count: totalUsers } = await (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { count: totalTours } = await (supabase as any)
          .from('tours')
          .select('*', { count: 'exact', head: true })

        const { count: activeGuides } = await (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'guide')
          .eq('is_active', true)

        setStats({
          totalUsers: totalUsers || 0,
          totalTours: totalTours || 0,
          activeGuides: activeGuides || 0,
          openIncidents: 0,
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Overview</h1>
        <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>Platform statistics and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Total Users */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.totalUsers}</p>
          <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>Total Users</p>
        </div>

        {/* Total Tours */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.totalTours}</p>
          <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>Total Tours</p>
        </div>

        {/* Active Guides */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.activeGuides}</p>
          <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>Active Guides</p>
        </div>

        {/* Open Incidents */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
        }}>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.openIncidents}</p>
          <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>Open Incidents</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="/admin/users/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            <span>➕</span>
            <span>Create User</span>
          </a>
          <a
            href="/admin/tours/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            <span>➕</span>
            <span>Create Tour</span>
          </a>
        </div>
      </div>
    </div>
  )
}