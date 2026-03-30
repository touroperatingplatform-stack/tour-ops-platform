'use client'

import AdminLayoutNew from '../admin/layout-new'

export default function TestPage() {
  return (
    <AdminLayoutNew>
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <h2 className="font-bold text-gray-800">Padding Test - 10 Options</h2>
          <p className="text-sm text-gray-600">Test different padding sizes between content and edges</p>
        </div>

        {/* 1. px-4 (16px) - Small */}
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mx-4">
          <h3 className="font-bold text-red-800 mb-2">Option 1: px-4 (16px)</h3>
          <p className="text-red-700 text-sm">Small padding - tight to edges</p>
        </div>

        {/* 2. px-5 (20px) */}
        <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 mx-5">
          <h3 className="font-bold text-orange-800 mb-2">Option 2: px-5 (20px)</h3>
          <p className="text-orange-700 text-sm">Slightly more breathing room</p>
        </div>

        {/* 3. px-6 (24px) - Medium */}
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mx-6">
          <h3 className="font-bold text-yellow-800 mb-2">Option 3: px-6 (24px)</h3>
          <p className="text-yellow-700 text-sm">Medium padding - balanced</p>
        </div>

        {/* 4. px-8 (32px) */}
        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 mx-8">
          <h3 className="font-bold text-green-800 mb-2">Option 4: px-8 (32px)</h3>
          <p className="text-green-700 text-sm">Comfortable spacing</p>
        </div>

        {/* 5. px-10 (40px) - EXTRA LARGE - BLUE */}
        <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 mx-10">
          <h3 className="font-bold text-blue-800 mb-2">Option 5: px-10 (40px) - EXTRA LARGE</h3>
          <p className="text-blue-700 text-sm">Lots of breathing room - matches top/bottom nav spacing</p>
        </div>

        {/* 6. px-12 (48px) */}
        <div className="bg-indigo-100 border-2 border-indigo-400 rounded-lg p-4 mx-12">
          <h3 className="font-bold text-indigo-800 mb-2">Option 6: px-12 (48px)</h3>
          <p className="text-indigo-700 text-sm">Very spacious</p>
        </div>

        {/* 7. px-16 (64px) */}
        <div className="bg-purple-100 border-2 border-purple-400 rounded-lg p-4 mx-16">
          <h3 className="font-bold text-purple-800 mb-2">Option 7: px-16 (64px)</h3>
          <p className="text-purple-700 text-sm">Tablet/desktop feel</p>
        </div>

        {/* 8. px-20 (80px) */}
        <div className="bg-pink-100 border-2 border-pink-400 rounded-lg p-4 mx-20">
          <h3 className="font-bold text-pink-800 mb-2">Option 8: px-20 (80px)</h3>
          <p className="text-pink-700 text-sm">Desktop focused</p>
        </div>

        {/* 9. px-24 (96px) */}
        <div className="bg-teal-100 border-2 border-teal-400 rounded-lg p-4 mx-24">
          <h3 className="font-bold text-teal-800 mb-2">Option 9: px-24 (96px)</h3>
          <p className="text-teal-700 text-sm">Maximum padding</p>
        </div>

        {/* 10. Mixed: Container px-4 + Content mx-4 */}
        <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4">
          <div className="mx-4">
            <h3 className="font-bold text-gray-800 mb-2">Option 10: Mixed (px-4 + mx-4)</h3>
            <p className="text-gray-700 text-sm">Container has 16px padding, content has 16px margin = 32px total</p>
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
            More content here to test scrolling. The content should have proper padding on all sides,
            matching the space between the top header and bottom navigation.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            Additional content to force scrolling. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </div>
    </AdminLayoutNew>
  )
}
