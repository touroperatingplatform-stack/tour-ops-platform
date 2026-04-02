'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Gray frame padding - space from screen edges */}
      <div className="flex-1 p-4 pb-20 overflow-hidden">
        {/* White bordered container - full width with visible border line */}
        <div className="mx-auto w-full h-full bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Top Navigation */}
          <header className="bg-white border-b border-gray-200 flex-shrink-0">
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

          {/* Page Content - padding inside scroll area */}
          <main className="flex-1 overflow-y-auto border-4 border-transparent">
            <div className="p-3 border-4 border-transparent">{children}</div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation - Fixed outside container at very bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16">
        <div className="flex justify-around items-center h-full max-w-full mx-auto px-4">
          <Link
            href="/guide"
            className="flex flex-col items-center justify-center flex-1 h-full relative text-gray-400"
          >
            <span className="text-xl">🚌</span>
            <span className="text-[10px] font-medium mt-0.5">Tours</span>
          </Link>
          <Link
            href="/guide/activity"
            className="flex flex-col items-center justify-center flex-1 h-full relative text-gray-400"
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-medium mt-0.5">Team</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center flex-1 h-full relative text-blue-600"
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
            <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-full" />
          </Link>
        </div>
      </nav>
    </div>
  )
}
