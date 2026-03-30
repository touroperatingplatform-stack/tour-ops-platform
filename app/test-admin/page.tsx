'use client'

import AdminLayoutNew from '../layout-new'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function TestPage() {
  const { t } = useTranslation()

  return (
    <AdminLayoutNew>
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-bold mb-2">Layout Test Page</h2>
          <p className="text-gray-600">This page tests the new layout structure.</p>
          <p className="text-sm text-gray-500 mt-2">If you see this with proper padding and navigation, the layout is working.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900">Card 1</h3>
            <p className="text-blue-700 text-sm mt-1">Test content</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <h3 className="font-semibold text-green-900">Card 2</h3>
            <p className="text-green-700 text-sm mt-1">Test content</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold mb-2">Long Content Test</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            This should scroll within the content area without affecting the navigation bars.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            More content here to test scrolling...
          </p>
        </div>
      </div>
    </AdminLayoutNew>
  )
}
