'use client'

export const dynamic = 'force-dynamic'

import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

export default function OperationsReportsPage() {
  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-500 mb-6">Coming soon - analytics and reporting will be available here</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Tour Performance</h3>
              <p className="text-sm text-gray-500">Guest counts, revenue, and tour statistics</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🚌 Vehicle Usage</h3>
              <p className="text-sm text-gray-500">Fleet utilization and maintenance tracking</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">👥 Guide Performance</h3>
              <p className="text-sm text-gray-500">Check-ins, incidents, and guest feedback</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
