'use client'

import AdminNav from '@/components/navigation/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="px-4 py-4 pb-6 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  )
}
