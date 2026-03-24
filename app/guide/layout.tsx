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
      <main className="pb-20">
        {children}
      </main>
    </div>
  )
}
