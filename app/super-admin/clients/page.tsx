'use client'

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
  status: string
  created_at: string
  companies_count: number
  users_count: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    try {
      // Load clients (company admins)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at, client_id')
        .eq('role', 'company_admin')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load company counts per client
      const { data: companiesData } = await supabase
        .from('companies')
        .select('client_id')

      // Count users per client
      const { data: usersData } = await supabase
        .from('profiles')
        .select('client_id')
        .neq('role', 'super_admin')

      // Build company count map
      const companyCountMap: Record<string, number> = {}
      companiesData?.forEach((c: any) => {
        companyCountMap[c.client_id] = (companyCountMap[c.client_id] || 0) + 1
      })

      // Build user count map
      const userCountMap: Record<string, number> = {}
      usersData?.forEach((u: any) => {
        if (u.client_id) {
          userCountMap[u.client_id] = (userCountMap[u.client_id] || 0) + 1
        }
      })

      const clientsWithCounts = profilesData?.map((client: any) => ({
        id: client.id,
        email: client.email,
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone,
        status: client.status,
        created_at: client.created_at,
        companies_count: companyCountMap[client.id] || 0,
        users_count: userCountMap[client.id] || 0
      })) || []

      setClients(clientsWithCounts)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadClientForEdit(clientId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (data) {
      setEditingClient(data)
      setFormData({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        password: ''
      })
    }
  }

  async function handleCreateClient() {
    setSaving(true)
    try {
      const { error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: 'company_admin'
        }
      })

      if (error) throw error

      setShowCreateModal(false)
      setFormData({ email: '', first_name: '', last_name: '', phone: '', password: '' })
      loadClients()
      alert('✅ Client created successfully!')
    } catch (error: any) {
      alert('❌ Error creating client: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateClient() {
    if (!editingClient) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('id', editingClient.id)

      if (error) throw error

      setShowEditModal(false)
      setEditingClient(null)
      setFormData({ email: '', first_name: '', last_name: '', phone: '', password: '' })
      loadClients()
      alert('✅ Client updated successfully!')
    } catch (error: any) {
      alert('❌ Error updating client: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteClient(clientId: string) {
    if (!confirm('⚠️ Delete this client and ALL their data?\n\nThis cannot be undone.')) return
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', clientId)
      if (error) throw error
      loadClients()
      alert('✅ Client deleted successfully')
    } catch (error: any) {
      alert('❌ Error deleting client: ' + error.message)
    }
  }

  async function handleSuspendClient(clientId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', clientId)

      if (error) throw error
      loadClients()
      alert('✅ Client suspended')
    } catch (error: any) {
      alert('❌ Error suspending client: ' + error.message)
    }
  }

  async function handleExportClientData(clientId: string) {
    try {
      // Fetch all client data
      const clientProfile = await supabase.from('profiles').select('*').eq('id', clientId).single()
      const clientCompanies = await supabase.from('companies').select('*').eq('client_id', clientId)
      const clientUsers = await supabase.from('profiles').select('*').eq('client_id', clientId)

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: clientProfile.data,
        companies: clientCompanies.data,
        users: clientUsers.data
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `client-export-${clientId}.json`
      a.click()

      alert('✅ Client data exported')
    } catch (error: any) {
      alert('❌ Error exporting: ' + error.message)
    }
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <AdminNav />
      
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
              </div>
              <div className="border-8 border-transparent">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="border-8 border-transparent bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  + Create Client
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0">
            <div className="border-8 border-transparent h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="border-8 border-transparent overflow-auto h-full">
                <table className="border-8 border-transparent w-full">
                  <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="border-8 border-transparent px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="border-8 border-transparent divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="border-8 border-transparent hover:bg-gray-50">
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <div className="border-8 border-transparent">
                            <p className="text-sm font-medium text-gray-900">
                              {client.first_name || client.last_name 
                                ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
                                : client.email
                              }
                            </p>
                          </div>
                          <div className="border-8 border-transparent">
                            <p className="text-sm text-gray-500">{client.email}</p>
                          </div>
                          {client.phone && (
                            <div className="border-8 border-transparent">
                              <p className="text-sm text-gray-500">{client.phone}</p>
                            </div>
                          )}
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/super-admin/companies?client=${client.id}`}
                            className="border-8 border-transparent text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {client.companies_count} companies
                          </Link>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <span className="border-8 border-transparent text-sm text-gray-900">{client.users_count} users</span>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <span className={`border-8 border-transparent px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.status === 'active' ? 'bg-green-100 text-green-800' :
                            client.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap">
                          <p className="border-8 border-transparent text-sm text-gray-500">{new Date(client.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="border-8 border-transparent px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              await loadClientForEdit(client.id)
                              setShowEditModal(true)
                            }}
                            className="border-8 border-transparent text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleExportClientData(client.id)}
                            className="border-8 border-transparent text-green-600 hover:text-green-900 mr-3"
                          >
                            Export
                          </button>
                          <button
                            onClick={() => handleSuspendClient(client.id)}
                            className="border-8 border-transparent text-yellow-600 hover:text-yellow-900 mr-3"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="border-8 border-transparent text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                          No clients yet. Create your first client to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="border-8 border-transparent p-4 border-b border-gray-200">
              <div className="border-8 border-transparent">
                <h2 className="text-lg font-bold text-gray-900">Create New Client</h2>
              </div>
            </div>
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent space-y-4">
                <div className="border-8 border-transparent">
                  <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div className="border-8 border-transparent">
                  <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div className="border-8 border-transparent grid grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div className="border-8 border-transparent">
                  <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="border-8 border-transparent p-4 border-t border-gray-100 flex justify-end gap-2">
              <div className="border-8 border-transparent">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ email: '', first_name: '', last_name: '', phone: '', password: '' })
                  }}
                  className="border-8 border-transparent bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
              <div className="border-8 border-transparent">
                <button
                  onClick={handleCreateClient}
                  disabled={saving || !formData.email || !formData.password}
                  className="border-8 border-transparent bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="border-8 border-transparent p-4 border-b border-gray-200">
              <div className="border-8 border-transparent">
                <h2 className="text-lg font-bold text-gray-900">Edit Client</h2>
              </div>
            </div>
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent space-y-4">
                <div className="border-8 border-transparent">
                  <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  />
                </div>
                <div className="border-8 border-transparent grid grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="border-8 border-transparent">
                    <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div className="border-8 border-transparent">
                  <label className="border-8 border-transparent block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="border-8 border-transparent mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="border-8 border-transparent p-4 border-t border-gray-100 flex justify-end gap-2">
              <div className="border-8 border-transparent">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingClient(null)
                    setFormData({ email: '', first_name: '', last_name: '', phone: '', password: '' })
                  }}
                  className="border-8 border-transparent bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
              <div className="border-8 border-transparent">
                <button
                  onClick={handleUpdateClient}
                  disabled={saving}
                  className="border-8 border-transparent bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
