'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function UnauthorizedPage() {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🚫</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this area.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Out & Switch Account
          </button>
          <Link
            href="/login"
            onClick={handleSignOut}
            className="block w-full text-gray-600 hover:text-gray-900 py-2"
          >
            Or sign in with different account
          </Link>
        </div>
      </div>
    </div>
  )
}
