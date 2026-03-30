'use client'

import AdminLayoutNew from '../admin/layout-new'

export default function TestPage() {
  return (
    <AdminLayoutNew>
      <div className="space-y-4">
        {/* Option A: px-6 py-4 (outer container) + content inside */}
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
          <h3 className="font-bold text-red-800 mb-2">Option A: Container has px-6 py-4</h3>
          <p className="text-red-700 text-sm">This shows the content area with red border. The outer container has px-6 py-4 padding.</p>
        </div>

        {/* Option B: Inner content with mx-4 */}
        <div className="mx-4 bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">Option B: Content has mx-4 margin</h3>
          <p className="text-blue-700 text-sm">This shows content with mx-4 margin (blue border). Content is inset from edges.</p>
        </div>

        {/* Both A + B */}
        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
          <h3 className="font-bold text-green-800 mb-2">Option C: Both A + B combined</h3>
          <p className="text-green-700 text-sm">Container has px-6 py-4 AND content has mx-4 margin. Most spacing.</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold mb-2">Long Content Test</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            This should scroll within the content area without affecting the navigation bars.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            More content here to test scrolling. The content should have proper padding on all sides,
            matching the space between the top header and bottom navigation.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            Additional content to force scrolling. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            Even more content here. The goal is to have consistent padding that feels balanced
            between the header and the bottom navigation bar.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            Final paragraph of test content. This helps verify that the scrollable area works correctly
            and that the padding feels natural on both mobile and desktop views.
          </p>
        </div>
      </div>
    </AdminLayoutNew>
  )
}
