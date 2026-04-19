'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'

// Role hierarchy - lower number = higher permission
const roleHierarchy: Record<string, number> = {
  super_admin: 1,
  company_admin: 2,
  manager: 3,
  supervisor: 4,
  operations: 5,
  guide: 6,
  driver: 6,
}

// All available roles
const allRoles = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'operations', label: 'Operations' },
  { value: 'guide', label: 'Guide' },
  { value: 'driver', label: 'Driver' },
]

export default function NewUserPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState(allRoles)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: 'guide',
    is_active: true,
  })

  // Load current user's role and filter available roles
  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        setCurrentUserRole(profile.role)
        
        // Filter roles - user can only create roles at or below their level
        const userLevel = roleHierarchy[profile.role] || 999
        const filtered = allRoles.filter(r => {
          const roleLevel = roleHierarchy[r.value]
          // User can only see roles below their level (not equal or above)
          return roleLevel > userLevel
        })
        
        setAvailableRoles(filtered)
        
        // Set default role to lowest available
        if (filtered.length > 0) {
          setFormData(prev => ({ ...prev, role: filtered[0].value }))
        }
      }
    }
    
    loadCurrentUser()
  }, [])

  function handleChange(field: string, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user's company
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.id)
        .single()

      const companyId = profile?.company_id
      if (!companyId) throw new Error('No company assigned')

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: 'temp-password-123',
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      })

      if (authError) throw authError

      // Then create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          company_id: companyId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          employee_id: formData.employee_id || null,
          role: formData.role,
          status: formData.is_active ? 'active' : 'inactive',
        })

      if (profileError) throw profileError

      router.push('/admin/users')
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full border-8 border-transparent">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div>
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('users.backToUsers')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('users.createNew')}</h1>
          <p className="text-sm text-gray-500">{t('users.addTeamMember')}</p>
        </div>

        {/* Form */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 overflow-auto">
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.firstName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={t('users.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.lastName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={t('users.lastNamePlaceholder')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.email')} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={t('users.emailPlaceholder')}
              />
            </div>

            {/* Phone & Employee ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={t('users.phonePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.employeeId')}</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => handleChange('employee_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={t('users.employeeIdPlaceholder')}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('users.role')} *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableRoles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleChange('role', role.value)}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{t(`roles.${role.value}`)}</p>
                  </button>
                ))}
              </div>
              {availableRoles.length === 0 && (
                <p className="text-sm text-red-600">{t('users.noRolesAvailable') || 'No roles available'}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('is_active', !formData.is_active)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.is_active ? 'left-7' : 'left-1'
                }`} />
              </button>
              <label className="text-sm font-medium text-gray-700">
                {t('users.userActive')}
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/admin/users"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading || availableRoles.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {loading ? t('users.creating') : t('users.createUser')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
