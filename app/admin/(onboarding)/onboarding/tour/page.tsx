'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingTour() {
  const router = useRouter()
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/admin/onboarding/team')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <span className="text-sm text-gray-500">Step 3 of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Quick tour</h1>
          <p className="text-sm text-gray-500">Here's your admin dashboard</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-32">
        <p className="text-gray-600 text-sm">
          Your dashboard shows everything at a glance — today's tours, active incidents, and team status.
        </p>

        {/* Dashboard Feature Cards */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dashboard</h3>
                <p className="text-sm text-gray-500 mt-1">
                  See all today's tours at a glance. Track active tours, completed tours, and any incidents that need attention.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🚌</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tours</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your daily tours. Assign guides, drivers, and vehicles. See who's running what and when.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🚐</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fleet & Team</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your vehicles and team. See who's available, track driver hours, and keep your fleet in top shape.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Reports</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track performance, guest counts, incidents, and revenue. Export data for your records.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ORDEN Import Option */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Import tomorrow's ORDEN</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload your ORDEN document to automatically create tomorrow's tours with all the pickup stops and guest details.
              </p>
            </div>
          </div>

          {!showImport ? (
            <button
              onClick={() => setShowImport(true)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Import ORDEN now
            </button>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center">
                <span className="text-3xl block mb-2">📁</span>
                <p className="text-sm text-gray-600 mb-3">Drop your ORDEN file here or click to browse</p>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Browse files
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                ORDEN format: Excel (.xlsx) or PDF
              </p>
            </div>
          )}

          <button
            onClick={() => router.push('/admin/onboarding/done')}
            className="w-full mt-3 text-indigo-600 py-2 text-sm font-medium hover:underline"
          >
            Skip for now — do this later
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/admin/onboarding/done')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700"
          >
            Finish →
          </button>
        </div>
      </div>
    </div>
  )
}
