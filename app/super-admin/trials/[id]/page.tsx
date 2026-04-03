'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'

interface TrialDetail {
  id: string
  trial_id: string
  company_id: string
  company_name: string
  started_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled' | 'converted'
  guide_count: number
  driver_count: number
}

export default function TrialManagePage() {
  const params = useParams()
  const router = useRouter()
  const trialId = params.id as string

  const [trial, setTrial] = useState<TrialDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendDays, setExtendDays] = useState('7')
  const [extending, setExtending] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTrial()
  }, [trialId])

  async function loadTrial() {
    try {
      const { data: company, error: coError } = await supabase
        .from('companies')
        .select('id, name, trial_id, created_at')
        .eq('id', trialId)
        .single()

      if (coError || !company) throw new Error('Trial company not found')

      let started_at = company.created_at
      let expires_at = ''
      let status: TrialDetail['status'] = 'active'

      if (company.trial_id) {
        const { data: trialRec } = await supabase
          .from('trials')
          .select('started_at, expires_at, status')
          .eq('id', company.trial_id)
          .single()

        if (trialRec) {
          started_at = trialRec.started_at
          expires_at = trialRec.expires_at
          status = trialRec.status
        }
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('role')
        .eq('company_id', trialId)

      const guide_count = profiles?.filter(p => p.role === 'guide').length || 0
      const driver_count = profiles?.filter(p => p.role === 'driver').length || 0

      setTrial({
        id: company.id,
        trial_id: company.trial_id || '',
        company_id: company.id,
        company_name: company.name,
        started_at,
        expires_at,
        status,
        guide_count,
        driver_count
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleExtend() {
    if (!trial?.trial_id) return
    setExtending(true)
    try {
      const { data: trialData } = await supabase
        .from('trials')
        .select('expires_at')
        .eq('id', trial.trial_id)
        .single()

      if (!trialData) throw new Error('Trial record not found')

      const currentExpiry = new Date(trialData.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + parseInt(extendDays) * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('trials')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', trial.trial_id)

      if (error) throw error

      alert('Trial extended by ' + extendDays + ' days. New expiry: ' + newExpiry.toLocaleDateString())
      setShowExtendModal(false)
      loadTrial()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setExtending(false)
    }
  }

  async function handleCancel() {
    if (!trial?.trial_id) return
    if (!confirm('Cancel this trial? The company and users will remain.')) return
    setCancelling(true)
    try {
      const { error } = await supabase
        .from('trials')
        .update({ status: 'cancelled' })
        .eq('id', trial.trial_id)

      if (error) throw error

      alert('Trial cancelled.')
      router.push('/super-admin/companies?tab=trials')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setCancelling(false)
    }
  }

  const daysRemaining = trial?.expires_at
    ? Math.max(0, Math.ceil((new Date(trial.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <RoleGuard requiredRole='super_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push('/super-admin/companies?tab=trials')}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to Trials
                </button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {trial?.company_name || 'Trial Details'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">Manage trial</p>
            </div>
          </div>

          {loading && <div className="text-gray-500 p-8">Loading...</div>}
          {error && <div className="text-red-500 p-8">{error}</div>}

          {!loading && trial && (
            <>
              {/* Status Banner */}
              <div className={`border-8 border-transparent rounded-xl p-4 mb-4 ${trial.status === 'active' ? 'bg-green-50' : trial.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500 uppercase">Status</span>
                    <p className={`text-lg font-bold ${trial.status === 'active' ? 'text-green-700' : trial.status === 'cancelled' ? 'text-red-700' : 'text-gray-700'}`}>
                      {trial.status.charAt(0).toUpperCase() + trial.status.slice(1)}
                    </p>
                  </div>
                  {trial.status === 'active' && (
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Days Remaining</span>
                      <p className="text-3xl font-bold text-blue-600">{daysRemaining}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trial Details */}
              <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
                <div className="border-8 border-transparent p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Started</span>
                      <p className="text-gray-900">{new Date(trial.started_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Expires</span>
                      <p className="text-gray-900">{new Date(trial.expires_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Guides</span>
                      <p className="text-gray-900">{trial.guide_count}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Drivers</span>
                      <p className="text-gray-900">{trial.driver_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {trial.status === 'active' && (
                <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0">
                  <div className="border-8 border-transparent p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowExtendModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Extend Trial
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Trial'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Extend Trial</h3>
            <p className="text-gray-600 mb-4">Current expiry: {trial?.expires_at ? new Date(trial.expires_at).toLocaleDateString() : 'N/A'}</p>
            <label className="block text-sm text-gray-600 mb-2">Extend by (days)</label>
            <select
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {extending ? 'Extending...' : 'Extend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
