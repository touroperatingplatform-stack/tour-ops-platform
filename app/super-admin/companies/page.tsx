'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  company_admin_email: string | null
  created_at: string
  tours_count: number
  users_count: number
  vehicles_count: number
}

interface Trial {
  id: string
  company_id: string
  company_name: string
  user_group: string
  created_at: string
  expires_at: string | null
  status: 'active' | 'expired' | 'converted'
  guide_count: number
  driver_count: number
}

interface UserGroup {
  id: string
  name: string
  user_count: number
}

// User groups available
const USER_GROUPS: UserGroup[] = [
  { id: 'group_1', name: 'Group 1 (LifeOperations)', user_count: 13 },
  { id: 'group_2', name: 'Group 2 (Future)', user_count: 13 },
]

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<'companies' | 'trials'>('companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create trial modal
  const [showCreateTrial, setShowCreateTrial] = useState(false)
  const [creating, setCreating] = useState(false)
  const [trialForm, setTrialForm] = useState({
    companyName: '',
    userGroup: 'group_1'
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    if (activeTab === 'companies') {
      await loadCompanies()
    } else {
      await loadTrials()
    }
    setLoading(false)
  }

  async function loadCompanies() {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const [toursData, profilesData, vehiclesData] = await Promise.all([
        supabase.from('tours').select('company_id'),
        supabase.from('profiles').select('company_id'),
        supabase.from('vehicles').select('company_id')
      ])

      const adminIds = companiesData?.map(c => c.company_admin_id).filter(Boolean) || []
      let adminsMap: Record<string, string> = {}
      if (adminIds.length > 0) {
        const { data: adminsData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', adminIds)
        adminsData?.forEach(a => { adminsMap[a.id] = a.email })
      }

      const toursCountMap: Record<string, number> = {}
      toursData?.data?.forEach((t: any) => {
        if (t.company_id) toursCountMap[t.company_id] = (toursCountMap[t.company_id] || 0) + 1
      })

      const profilesCountMap: Record<string, number> = {}
      profilesData?.data?.forEach((p: any) => {
        if (p.company_id) profilesCountMap[p.company_id] = (profilesCountMap[p.company_id] || 0) + 1
      })

      const vehiclesCountMap: Record<string, number> = {}
      vehiclesData?.data?.forEach((v: any) => {
        if (v.company_id) vehiclesCountMap[v.company_id] = (vehiclesCountMap[v.company_id] || 0) + 1
      })

      const companiesWithCounts = (companiesData || []).map((company: any) => ({
        ...company,
        company_admin_email: adminsMap[company.company_admin_id] || null,
        tours_count: toursCountMap[company.id] || 0,
        users_count: profilesCountMap[company.id] || 0,
        vehicles_count: vehiclesCountMap[company.id] || 0
      }))

      setCompanies(companiesWithCounts)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  async function loadTrials() {
    // For now, trials are just companies - in future they'll have their own table
    try {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      // Get profiles to count guides/drivers per company
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('company_id, role')

      const trialsData: Trial[] = (companiesData || []).map((company: any) => {
        const companyProfiles = profilesData?.filter(p => p.company_id === company.id) || []
        return {
          id: company.id,
          company_id: company.id,
          company_name: company.name,
          user_group: 'group_1',
          created_at: company.created_at,
          expires_at: null,
          status: 'active' as const,
          guide_count: companyProfiles.filter(p => p.role === 'guide').length,
          driver_count: companyProfiles.filter(p => p.role === 'driver').length
        }
      })

      setTrials(trialsData)
    } catch (error) {
      console.error('Error loading trials:', error)
    }
  }

  async function handleCreateTrial() {
    if (!trialForm.companyName) {
      alert('Please enter a company name')
      return
    }

    setCreating(true)
    try {
      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: trialForm.companyName,
          slug: trialForm.companyName.toLowerCase().replace(/\s+/g, '-'),
          company_admin_id: null
        })
        .select('id')
        .single()

      if (companyError) throw companyError
      const companyId = company.id

      // 2. Link existing demo_ users (Group 1)
      const demoEmails = [
        'demo_guide1@lifeoperations.com',
        'demo_guide2@lifeoperations.com',
        'demo_guide3@lifeoperations.com',
        'demo_guide4@lifeoperations.com',
        'demo_guide5@lifeoperations.com',
        'demo_driver1@lifeoperations.com',
        'demo_driver2@lifeoperations.com',
        'demo_driver3@lifeoperations.com',
        'demo_driver4@lifeoperations.com',
        'demo_driver5@lifeoperations.com',
        'demo_ops@lifeoperations.com',
        'demo_supervisor@lifeoperations.com',
        'demo_admin@lifeoperations.com',
      ]

      for (const email of demoEmails) {
        await supabase
          .from('profiles')
          .update({ company_id: companyId })
          .eq('email', email)
      }

      // 3. Create 5 demo vehicles
      const vehicleNames = ['Van 1', 'Van 2', 'Van 3', 'Van 4', 'Van 5']
      for (let i = 0; i < 5; i++) {
        await supabase.from('vehicles').insert({
          company_id: companyId,
          plate_number: `TRL-${companyId.slice(0,4).toUpperCase()}-${i + 1}`,
          make: 'Toyota',
          model: 'Hiace',
          capacity: 12,
          status: 'available'
        })
      }

      alert(`✅ Trial "${trialForm.companyName}" created!\n\nGuide login: demo_guide5@lifeoperations.com\nPassword: demo1234`)
      setShowCreateTrial(false)
      setTrialForm({ companyName: '', userGroup: 'group_1' })
      loadTrials()

    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  function generatePDF(trial: Trial) {
    // Generate credentials document
    const credentials = `
=======================================
TRIAL CREDENTIALS - ${trial.company_name}
=======================================

Welcome! Here's your trial login information.

LOGIN DETAILS:
--------------
Company: ${trial.company_name}

GUIDES (login with any of these):
• guide1@lifeoperations.com / demo1234
• guide2@lifeoperations.com / demo1234
• guide3@lifeoperations.com / demo1234
• guide4@lifeoperations.com / demo1234
• guide5@lifeoperations.com / demo1234

DRIVERS:
• driver1@lifeoperations.com / demo1234
• driver2@lifeoperations.com / demo1234
• driver3@lifeoperations.com / demo1234
• driver4@lifeoperations.com / demo1234
• driver5@lifeoperations.com / demo1234

OPERATIONS:
• ops@lifeoperations.com / demo1234

=======================================
    `.trim()

    // Create and download
    const blob = new Blob([credentials], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trial-credentials-${trial.company_name.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
              </div>
              <div className="border-8 border-transparent">
                <p className="text-gray-600 text-sm mt-1">Manage companies and trials</p>
              </div>

              {/* Tabs */}
              <div className="border-8 border-transparent mt-4 flex gap-4">
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'companies'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Companies
                </button>
                <button
                  onClick={() => setActiveTab('trials')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeTab === 'trials'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Trials
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 min-h-0">
            <div className="border-8 border-transparent h-full bg-white rounded-lg border border-gray-200 overflow-hidden">

              {activeTab === 'companies' ? (
                /* Companies Tab */
                <div className="border-8 border-transparent h-full flex flex-col">
                  <div className="border-8 border-transparent p-4 flex justify-end">
                    <button
                      onClick={() => setShowCreateTrial(true)}
                      className="border-8 border-transparent bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      + Create Trial
                    </button>
                  </div>
                  <div className="border-8 border-transparent flex-1 min-h-0 overflow-auto">
                    <table className="border-8 border-transparent w-full">
                      <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tours</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicles</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="border-8 border-transparent divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="border-8 border-transparent hover:bg-gray-50">
                            <td className="border-8 border-transparent px-6 py-4">
                              <p className="font-medium text-gray-900">{company.name}</p>
                              <p className="text-sm text-gray-500">{company.slug}</p>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4">
                              {company.company_admin_email ? (
                                <p className="text-sm text-gray-900">{company.company_admin_email}</p>
                              ) : (
                                <span className="text-sm text-gray-400 italic">No owner</span>
                              )}
                            </td>
                            <td className="border-8 border-transparent px-6 py-4">
                              <Link href={`/operations?company=${company.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                {company.tours_count} tours
                              </Link>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm">{company.users_count}</td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm">{company.vehicles_count}</td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm text-gray-500">
                              {new Date(company.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {companies.length === 0 && (
                          <tr>
                            <td colSpan={6} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                              No companies found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Trials Tab */
                <div className="border-8 border-transparent h-full flex flex-col">
                  <div className="border-8 border-transparent p-4 flex justify-between items-center">
                    <p className="text-sm text-gray-500">{trials.length} trial(s)</p>
                    <button
                      onClick={() => setShowCreateTrial(true)}
                      className="border-8 border-transparent bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      + Create New Trial
                    </button>
                  </div>
                  <div className="border-8 border-transparent flex-1 min-h-0 overflow-auto">
                    <table className="border-8 border-transparent w-full">
                      <thead className="border-8 border-transparent bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Group</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guides</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drivers</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="border-8 border-transparent px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="border-8 border-transparent divide-y divide-gray-200">
                        {trials.map((trial) => (
                          <tr key={trial.id} className="border-8 border-transparent hover:bg-gray-50">
                            <td className="border-8 border-transparent px-6 py-4">
                              <p className="font-medium text-gray-900">{trial.company_name}</p>
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                trial.status === 'active' ? 'bg-green-100 text-green-800' :
                                trial.status === 'expired' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {trial.status}
                              </span>
                            </td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm">{trial.user_group}</td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm">{trial.guide_count}</td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm">{trial.driver_count}</td>
                            <td className="border-8 border-transparent px-6 py-4 text-sm text-gray-500">
                              {new Date(trial.created_at).toLocaleDateString()}
                            </td>
                            <td className="border-8 border-transparent px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generatePDF(trial)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Download Credentials
                                </button>
                                <Link
                                  href={`/admin/trials/${trial.id}`}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  Manage
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {trials.length === 0 && (
                          <tr>
                            <td colSpan={6} className="border-8 border-transparent px-6 py-8 text-center text-gray-500">
                              No trials yet. Click "Create New Trial" to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Trial Modal */}
      {showCreateTrial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="border-8 border-transparent p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Create New Trial</h2>
              <p className="text-sm text-gray-500 mt-1">Setup a new 5-user trial company</p>
            </div>
            <div className="border-8 border-transparent p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={trialForm.companyName}
                  onChange={e => setTrialForm({...trialForm, companyName: e.target.value})}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Client's Tour Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User Group</label>
                <select
                  value={trialForm.userGroup}
                  onChange={e => setTrialForm({...trialForm, userGroup: e.target.value})}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {USER_GROUPS.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.user_count} users)
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">This will create:</p>
                <p>• 5 Guide accounts</p>
                <p>• 5 Driver accounts</p>
                <p>• 1 Ops, 1 Supervisor, 1 Admin</p>
                <p>• 5 Vehicles</p>
                <p className="mt-2">Guide login: demo_guide5@lifeoperations.com</p>
                <p>All passwords: demo1234</p>
              </div>
            </div>
            <div className="border-8 border-transparent p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateTrial(false)}
                className="border-8 border-transparent bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrial}
                disabled={creating}
                className="border-8 border-transparent bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Trial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
