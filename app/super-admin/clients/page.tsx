'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import Link from 'next/link'

interface Client {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  status: 'active' | 'suspended' | 'trial'
  created_at: string
  companies_count: number
  users_count: number
}

interface FeatureFlags {
  // Core Roles
  enableGuides: boolean
  enableDrivers: boolean
  enableOperations: boolean
  enableSupervisor: boolean
  enableManager: boolean
  // Features
  enableIncidents: boolean
  enableExpenses: boolean
  enableReports: boolean
  enableGuestFeedback: boolean
  enableActivityFeed: boolean
  enableDriverCheckin: boolean
  enablePickupStops: boolean
  // Advanced
  enableExternalBookings: boolean
  enableMultiCompany: boolean
  enableCustomBranding: boolean
  enableApiIntegrations: boolean
}

interface UsageLimits {
  maxCompanies: number
  maxUsers: number
  maxGuides: number
  maxDrivers: number
  maxToursPerDay: number
  maxGuestsPerMonth: number
  maxVehicles: number
}

export default function SuperAdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'suspended' | 'trial',
    features: {
      enableGuides: true,
      enableDrivers: true,
      enableOperations: true,
      enableSupervisor: true,
      enableManager: true,
      enableIncidents: true,
      enableExpenses: true,
      enableReports: true,
      enableGuestFeedback: true,
      enableActivityFeed: true,
      enableDriverCheckin: true,
      enablePickupStops: true,
      enableExternalBookings: true,
      enableMultiCompany: true,
      enableCustomBranding: true,
      enableApiIntegrations: true
    } as FeatureFlags,
    limits: {
      maxCompanies: 5,
      maxUsers: 50,
      maxGuides: 20,
      maxDrivers: 10,
      maxToursPerDay: 100,
      maxGuestsPerMonth: 10000,
      maxVehicles: 20
    } as UsageLimits
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, created_at')
        .eq('role', 'company_admin')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const clientList: Client[] = []
      for (const client of data || []) {
        // Count companies
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('company_admin_id', client.id)
        
        // Count users (all roles for this client's companies)
        const { data: clientCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('company_admin_id', client.id)
        
        let usersCount = 1 // Count the client admin themselves
        if (clientCompanies && clientCompanies.length > 0) {
          const companyIds = clientCompanies.map(c => c.id)
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('company_id', companyIds)
          usersCount += count || 0
        }
        
        clientList.push({
          id: client.id,
          email: client.email,
          first_name: client.first_name,
          last_name: client.last_name,
          phone: client.phone,
          status: 'active', // Would need a clients table for real status
          created_at: client.created_at || '',
          companies_count: companiesCount || 0,
          users_count: usersCount
        })
      }
      
      setClients(clientList)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      
      // 2. Create profile with company_admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'company_admin',
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company_admin_id: authData.user.id
        })
        .eq('id', authData.user.id)
      
      if (profileError) throw profileError
      
      // 3. TODO: Create company_config entry with features/limits
      // For now, features/limits are in form but not stored
      
      alert('Client created successfully!')
      setShowCreateModal(false)
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        status: 'active',
        features: { ...formData.features },
        limits: { ...formData.limits }
      })
      loadClients()
    } catch (error: any) {
      alert('Error creating client: ' + error.message)
    }
  }

  async function handleSuspendClient(clientId: string) {
    if (!confirm('Suspend this client? They will lose access to the platform.')) return
    
    try {
      // Update profile status (would need a status field)
      alert('Client suspended (placeholder - needs implementation)')
      loadClients()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function handleDeleteClient(clientId: string) {
    if (!confirm('DELETE this client and ALL their data? This cannot be undone!')) return
    if (!confirm('Are you absolutely sure? This will delete companies, tours, users, everything!')) return
    
    alert('Delete functionality needs careful implementation - contact developer')
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <AdminNav />
      
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Client Management</h1>
              <p className="text-gray-600">Create and manage client accounts</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              + Create Client
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading clients...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Companies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client.first_name || client.last_name 
                          ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
                          : client.email
                        }
                      </div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                      {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/super-admin/companies?client=${client.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {client.companies_count} companies
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{client.users_count} users</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' :
                        client.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedClient(client)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSuspendClient(client.id)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No clients yet. Create your first client to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Create New Client</h2>
              <p className="text-gray-600">Set up a new client account with features and limits</p>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6">
              {/* Basic Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Enabled Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Core Roles</h4>
                    {Object.entries(formData.features)
                      .filter(([key]) => key.startsWith('enableGuides') || key.startsWith('enableDrivers') || key.startsWith('enableOperations') || key.startsWith('enableSupervisor') || key.startsWith('enableManager'))
                      .map(([key, value]) => (
                        <label key={key} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              features: { ...formData.features, [key]: e.target.checked }
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm">{key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Features</h4>
                    {Object.entries(formData.features)
                      .filter(([key]) => ['enableIncidents', 'enableExpenses', 'enableReports', 'enableGuestFeedback', 'enableActivityFeed', 'enableDriverCheckin', 'enablePickupStops'].includes(key))
                      .map(([key, value]) => (
                        <label key={key} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              features: { ...formData.features, [key]: e.target.checked }
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm">{key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h4 className="font-medium mb-3">Advanced Features</h4>
                    {Object.entries(formData.features)
                      .filter(([key]) => ['enableExternalBookings', 'enableMultiCompany', 'enableCustomBranding', 'enableApiIntegrations'].includes(key))
                      .map(([key, value]) => (
                        <label key={key} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              features: { ...formData.features, [key]: e.target.checked }
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm">{key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Usage Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Companies
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxCompanies}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxCompanies: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Users
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxUsers}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxUsers: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Guides
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxGuides}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxGuides: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Drivers
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxDrivers}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxDrivers: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Tours/Day
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxToursPerDay}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxToursPerDay: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Guests/Month
                    </label>
                    <input
                      type="number"
                      value={formData.limits.maxGuestsPerMonth}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limits: { ...formData.limits, maxGuestsPerMonth: parseInt(e.target.value) }
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal (placeholder) */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Client</h2>
            <p className="text-gray-600 mb-4">{selectedClient.email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Full edit functionality coming soon. For now, you can suspend or delete this client.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
