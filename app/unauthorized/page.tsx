import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🚫</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this area.
        </p>
        <div className="space-y-3">
          <Link 
            href="/" 
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link 
            href="/login" 
            className="block text-gray-600 hover:text-gray-900"
          >
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  )
}
