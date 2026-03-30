'use client'

import AdminLayoutNew from '../admin/layout-new'

export default function TestPage() {
  return (
    <AdminLayoutNew>
      <div className="space-y-6">
        <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg p-3 mb-4">
          <h2 className="font-bold text-gray-800">Container Padding Test</h2>
          <p className="text-sm text-gray-600">The GREY BORDER shows the container edge. Content inside should have spacing from this edge.</p>
        </div>

        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
          <h3 className="font-bold text-red-800 mb-2">NO MARGIN - Touching Container Edge</h3>
          <p className="text-red-700 text-sm">This red box has NO margin. It touches the grey container edge.</p>
        </div>

        <div className="bg-orange-100 border-2 border-orange-500 rounded-lg p-4 mx-4">
          <h3 className="font-bold text-orange-800 mb-2">mx-4 (16px) margin</h3>
          <p className="text-orange-700 text-sm">This orange box has 16px margin. You should see space between red box and orange box.</p>
        </div>

        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mx-8">
          <h3 className="font-bold text-green-800 mb-2">mx-8 (32px) margin</h3>
          <p className="text-green-700 text-sm">This green box has 32px margin. More space from edge.</p>
        </div>

        <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 mx-10">
          <h3 className="font-bold text-blue-800 mb-2">mx-10 (40px) margin - EXTRA LARGE</h3>
          <p className="text-blue-700 text-sm">This BLUE box has 40px margin. Most spacing from edge.</p>
        </div>

        <div className="bg-purple-100 border-2 border-purple-500 rounded-lg p-4 mx-16">
          <h3 className="font-bold text-purple-800 mb-2">mx-16 (64px) margin</h3>
          <p className="text-purple-700 text-sm">This purple box has 64px margin. Very spacious.</p>
        </div>

        <div className="bg-gray-200 border-2 border-gray-500 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">No margin (full width inside container)</h3>
          <p className="text-gray-700 text-sm">This grey box has no margin. It stretches to the container edges.</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold mb-2">Long Content Test</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            This should scroll within the content area without affecting the navigation bars.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            More content here to test scrolling. The content should have proper padding on all sides.
          </p>
        </div>
      </div>
    </AdminLayoutNew>
  )
}
