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
  configs: Record<string, boolean>
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
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [savingConfig, setSavingConfig] = useState<string | null>(null)

  useEffect(() => {
    loadTrial()
  }, [trialId])

  async function loadTrial() {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, trial_id, created_at')
        .eq('id', trialId)
        .maybeSingle()

      if (!company) {
        setError('Trial not found — it may have been deleted.')
        setLoading(false)
        return
      }

      let started_at = company.created_at
      let expires_at = ''
      let status: TrialDetail['status'] = 'active'

      if (company.trial_id) {
        const { data: trialRec } = await supabase
          .from('trials')
          .select('started_at, expires_at, status')
          .eq('id', company.trial_id)
          .maybeSingle()

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

      // Load company configs
      const { data: configsData } = await supabase
        .from('company_configs')
        .select('config_key, config_value')
        .eq('company_id', company.id)

      const configs: Record<string, boolean> = {}
      configsData?.forEach((cfg: any) => {
        configs[cfg.config_key] = cfg.config_value
      })

      setTrial({
        id: company.id,
        trial_id: company.trial_id || '',
        company_id: company.id,
        company_name: company.name,
        started_at,
        expires_at,
        status,
        guide_count,
        driver_count,
        configs
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

  async function handleDelete() {
    if (!trial) return
    const msg = `Delete trial "${trial.company_name}"?\n\nThis will permanently delete all related data and cannot be undone.`
    if (!confirm(msg)) return
    setDeleting(true)
    try {
      // Get all tours for this company first
      const { data: tours } = await supabase
        .from('tours')
        .select('id')
        .eq('company_id', trial.company_id)
      const tourIds = tours?.map(t => t.id) || []

      // 1. Delete payments where tour_id IN tours
      if (tourIds.length > 0) {
        await supabase
          .from('payments')
          .delete()
          .in('tour_id', tourIds)
      }

      // 2. Delete reservation_manifest where tour_id IN tours
      if (tourIds.length > 0) {
        await supabase
          .from('reservation_manifest')
          .delete()
          .in('tour_id', tourIds)
      }

      // 3. Delete pickup_stops where tour_id IN tours
      if (tourIds.length > 0) {
        await supabase
          .from('pickup_stops')
          .delete()
          .in('tour_id', tourIds)
      }

      // 4. Delete guide_checkins where tour_id IN tours
      if (tourIds.length > 0) {
        await supabase
          .from('guide_checkins')
          .delete()
          .in('tour_id', tourIds)
      }

      // 5. Delete driver_checkins where tour_id IN tours
      if (tourIds.length > 0) {
        await supabase
          .from('driver_checkins')
          .delete()
          .in('tour_id', tourIds)
      }

      // 6. Delete tours where company_id = ?
      await supabase
        .from('tours')
        .delete()
        .eq('company_id', trial.company_id)

      // 7. Delete vehicles where company_id = ?
      await supabase
        .from('vehicles')
        .delete()
        .eq('company_id', trial.company_id)

      // 8. Delete brands where company_id = ?
      await supabase
        .from('brands')
        .delete()
        .eq('company_id', trial.company_id)

      // 9. Reset all demo_ profiles (set company_id and brand_id to null, onboarding_completed to false)
      await supabase
        .from('profiles')
        .update({ company_id: null, brand_id: null, onboarding_completed: false })
        .eq('company_id', trial.company_id)

      // 10. Delete trial record
      if (trial.trial_id) {
        await supabase
          .from('trials')
          .delete()
          .eq('id', trial.trial_id)
      }

      // 11. Delete company
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', trial.company_id)

      if (error) throw error

      alert('Trial deleted successfully.')
      router.push('/super-admin/companies?tab=trials')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleConfig(key: string, value: boolean) {
    if (!trial) return
    setSavingConfig(key)
    try {
      const { error } = await supabase
        .from('company_configs')
        .upsert({
          company_id: trial.company_id,
          config_key: key,
          config_value: value
        }, { onConflict: 'company_id,config_key' })

      if (error) throw error

      setTrial(prev => prev ? {
        ...prev,
        configs: { ...prev.configs, [key]: value }
      } : null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSavingConfig(null)
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

              {/* OEM Flags */}
              <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
                <div className="border-8 border-transparent p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">OEM Features</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'guide_app', label: 'Guide App' },
                      { key: 'driver_app', label: 'Driver App' },
                      { key: 'operations_dashboard', label: 'Operations Dashboard' },
                      { key: 'supervisor_dashboard', label: 'Supervisor Dashboard' },
                      { key: 'orden_import', label: 'ORDEN Import' },
                      { key: 'csv_import', label: 'CSV Import' },
                      { key: 'push_notifications', label: 'Push Notifications' },
                      { key: 'sms_notifications', label: 'SMS Notifications' },
                      { key: 'offline_mode', label: 'Offline Mode' },
                      { key: 'photo_uploads', label: 'Photo Uploads' },
                      { key: 'incident_reporting', label: 'Incident Reporting' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-900">{label}</span>
                        <button
                          onClick={() => handleToggleConfig(key, !trial.configs[key])}
                          disabled={savingConfig === key}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${trial.configs[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trial.configs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0">
                <div className="border-8 border-transparent p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                  <div className="flex gap-4">
                    {trial.status === 'active' && (
                      <button
                        onClick={() => setShowExtendModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Extend Trial
                      </button>
                    )}
                    {trial.status !== 'cancelled' && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Trial'}
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete Trial'}
                    </button>
                  </div>
                </div>
              </div>
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
