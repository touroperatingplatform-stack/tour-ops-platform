'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingDone() {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)

  async function handleFinish() {
    setCompleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      router.push('/admin')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">✅</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          You're all set!
        </h1>
        <p className="text-gray-600 mb-8">
          Your team is ready to start running tours. Remember — you can always change settings and add more details later.
        </p>

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">What's next:</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">Import tomorrow's ORDEN to create your first tours</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">Check the Operations dashboard to see live tour progress</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">Add your team to the platform if you need more than the trial accounts</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleFinish}
          disabled={completing}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50"
        >
          {completing ? 'Setting up...' : 'Go to Dashboard →'}
        </button>
      </div>
    </div>
  )
}
