'use client'

export const dynamic = 'force-dynamic'

import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function OperationsReportsPage() {
  const { t } = useTranslation()
  
  return (
    <RoleGuard requiredRole="operations">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('reports.title')}</h1>
          <p className="text-gray-500 mb-6">{t('reports.comingSoon') || 'Coming soon - analytics and reporting will be available here'}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">📊 {t('reports.tourPerformance') || 'Tour Performance'}</h3>
              <p className="text-sm text-gray-500">{t('reports.tourPerformanceDesc') || 'Guest counts, revenue, and tour statistics'}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🚌 {t('reports.vehicleUsage') || 'Vehicle Usage'}</h3>
              <p className="text-sm text-gray-500">{t('reports.vehicleUsageDesc') || 'Fleet utilization and maintenance tracking'}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">👥 {t('reports.guidePerformance') || 'Guide Performance'}</h3>
              <p className="text-sm text-gray-500">{t('reports.guidePerformanceDesc') || 'Check-ins, incidents, and guest feedback'}</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
