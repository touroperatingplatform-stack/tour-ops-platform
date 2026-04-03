'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingWelcome() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /admin if already completed (guard only runs in layout)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {/* Logo / Icon */}
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚀</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Tour Ops
        </h1>
        <p className="text-gray-600 mb-8">
          Let's get your team set up in just a few minutes. This quick tour will show you everything you need to start running tours.
        </p>

        {/* What you'll set up */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">Here's what we'll cover:</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Name your team</p>
                <p className="text-sm text-gray-500">Rename your guides, drivers, and vans</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Quick tour</p>
                <p className="text-sm text-gray-500">See your dashboard and how to run tours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Import your first ORDEN</p>
                <p className="text-sm text-gray-500">Upload tomorrow's tour plan (optional)</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/admin/onboarding/team')}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          Let's get started →
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Takes about 2 minutes
        </p>
      </div>
    </div>
  )
}
