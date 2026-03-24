'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navItems = [
    { href: '/guide', label: 'Back to Tours', icon: '←' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* App Container with Border - Universal across all pages */}
      <div className="mx-auto w-full max-w-full bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/guide" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </Link>
            </div>
            <span className="font-semibold text-gray-900">Profile</span>
            <div className="w-10"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
