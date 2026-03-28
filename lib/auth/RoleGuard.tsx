'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { hasRole, type Role } from './roles'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: Role | Role[]
  fallback?: React.ReactNode
}

export default function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setAuthorized(false)
          setUserRole(null)
          return
        }

        setUserEmail(user.email || '')

        // Get user's role from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role as Role | null
        setUserRole(role)
        // Handle both single role and array of roles
        const isAuthorized = Array.isArray(requiredRole) 
          ? requiredRole.some(r => hasRole(role, r))
          : hasRole(role, requiredRole)
        setAuthorized(isAuthorized)
      } catch (error) {
        console.error('RoleGuard auth check failed:', error)
        setAuthorized(false)
      }
    }

    checkAuth()
  }, [requiredRole])

  // Show nothing while checking
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Show access denied page
  if (!authorized) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <div className="mb-3">
              <span className="text-sm text-gray-500">Logged in as:</span>
              <p className="text-gray-900 font-medium">{userEmail || 'Unknown user'}</p>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Your role:</span>
              <p className="text-red-600 font-medium">{userRole || 'No role assigned'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Required role:</span>
              <p className="text-blue-600 font-medium">
                {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Contact your administrator if you believe you need access to this page.
          </p>

          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // User is authorized - render the page
  return <>{children}</>
}
