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
      <main className="p-4 pb-6">
        {children}
      </main>
    </div>
  )
}
