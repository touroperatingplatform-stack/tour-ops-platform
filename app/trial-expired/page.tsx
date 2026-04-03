import Link from 'next/link'

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl mb-4">⏰</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Ended</h2>
        <p className="text-gray-600 mb-6">
          Your trial period has expired. Get in touch with our team to discuss
          pricing plans that fit your business.
        </p>
        <div className="space-y-3">
          <a
            href="mailto:sales@lifeoperations.com?subject=Tour Ops Platform - Trial Enquiry"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Sales
          </a>
          <Link
            href="/"
            className="block text-gray-600 hover:text-gray-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
