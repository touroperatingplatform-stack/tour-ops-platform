'use client'

import TestLayout from './TestLayout'

export default function TestPage() {
  return (
    <TestLayout>
      <div className="space-y-8">
        <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg p-3">
          <h2 className="font-bold text-gray-800">Container Padding Test</h2>
          <p className="text-sm text-gray-600">The PINK area is the scrollable container. Content should have space from the pink edges.</p>
        </div>

        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
          <h3 className="font-bold text-red-800 mb-2">NO MARGIN (mx-0)</h3>
          <p className="text-red-700 text-sm">This touches the pink container edge. No space on sides.</p>
        </div>

        <div className="px-4">
          <div className="bg-orange-100 border-2 border-orange-500 rounded-lg p-4">
            <h3 className="font-bold text-orange-800 mb-2">mx-4 (16px)</h3>
            <p className="text-orange-700 text-sm">Parent has px-4 padding. Space from pink edge.</p>
          </div>
        </div>

        <div className="px-6">
          <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800 mb-2">mx-6 (24px)</h3>
            <p className="text-yellow-700 text-sm">Parent has px-6 padding. More space.</p>
          </div>
        </div>

        <div className="px-8">
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">mx-8 (32px)</h3>
            <p className="text-green-700 text-sm">Parent has px-8 padding. Comfortable.</p>
          </div>
        </div>

        <div className="px-10">
          <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">mx-10 (40px) - EXTRA LARGE</h3>
            <p className="text-blue-700 text-sm">Parent has px-10 padding. Most space.</p>
          </div>
        </div>

        <div className="px-12">
          <div className="bg-indigo-100 border-2 border-indigo-500 rounded-lg p-4">
            <h3 className="font-bold text-indigo-800 mb-2">mx-12 (48px)</h3>
            <p className="text-indigo-700 text-sm">Parent has px-12 padding. Very spacious.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold mb-2">Long Content Test</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Testing scroll behavior within the pink container area.
            The container has px-6 padding (24px) by default.
            Content inside can add more margin if needed.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            More content here to test scrolling. The pink border shows the container boundary.
          </p>
        </div>
      </div>
    </TestLayout>
  )
}
