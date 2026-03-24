'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (checkingRef.current) return
    checkingRef.current = true

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Login page - Session check:', session ? 'found' : 'none')
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          console.log('Login page - Profile:', profile?.role)
          
          if (profile) {
            const redirects: Record<string, string> = {
              super_admin: '/admin',
              company_admin: '/admin',
              supervisor: '/supervisor',
              manager: '/supervisor',
              operations: '/operations',
              guide: '/guide',
            }
            console.log('Login page - Redirecting to:', redirects[profile.role])
            window.location.href = redirects[profile.role] || '/admin'
            return
          }
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
      setChecked(true)
    }

    checkSession()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Login - Attempting sign in...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.log('Login - Sign in error:', signInError.message)
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      if (!data.user) {
        console.log('Login - No user returned')
        setError('Login failed')
        setLoading(false)
        return
      }

      console.log('Login - User signed in:', data.user.email)
      console.log('Login - Session:', data.session ? 'present' : 'missing')

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      console.log('Login - Profile:', profile)

      if (!profile) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      if (!profile.is_active) {
        setError('Account deactivated')
        setLoading(false)
        return
      }

      const redirects: Record<string, string> = {
        super_admin: '/admin',
        company_admin: '/admin',
        supervisor: '/supervisor',
        manager: '/supervisor',
        operations: '/operations',
        guide: '/guide',
      }
      
      const redirectPath = redirects[profile.role] || '/admin'
      console.log('Login - Redirecting to:', redirectPath)
      
      // Use href for full page reload
      window.location.href = redirectPath
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError('An error occurred')
      setLoading(false)
    }
  }

  if (!checked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <p>Checking session...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '384px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#2563eb',
            marginBottom: '16px',
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>T</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Tour Ops</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '24px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="********"
            />
          </div>

          {error && (
            <p style={{
              color: '#dc2626',
              fontSize: '14px',
              backgroundColor: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
          Accounts are created by your administrator
        </p>
      </div>
    </div>
  )
}
