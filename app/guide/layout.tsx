'use client'

import GuideNav from '@/components/navigation/GuideNav'

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <GuideNav />
      <main className="px-4 pb-20 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  )
}
