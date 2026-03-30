'use client'

import TestLayout from './TestLayout'

export default function TestPage() {
  return (
    <TestLayout>
      <div className="h-full flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex-none text-center py-2">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI CARDS ROW */}
        <div className="flex-none">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold">17/19</span>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
              <p className="text-xs text-gray-500 uppercase font-medium mt-2">Tours Today</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-blue-600">132</p>
              <p className="text-xs text-blue-600 uppercase font-medium mt-2">Guests Today</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-green-600">94%</p>
              <p className="text-xs text-green-600 uppercase font-medium mt-2">On Time %</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-xs text-red-600 uppercase font-medium mt-2">Incidents</p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full grid grid-cols-12 gap-6">
            {/* Active Tours + Team - Left */}
            <div className="col-span-4 h-full overflow-auto">
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 uppercase font-medium">Active Tours</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">2 LIVE</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">2</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase font-medium text-center mb-3">Team Status</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">2/19</p>
                      <p className="text-xs text-gray-500">Guides</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">6</p>
                      <p className="text-xs text-gray-500">Vehicles</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 text-center">Extra content to test scrolling in this section...</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 text-center">More content here...</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 text-center">Even more content to force scroll...</p>
                </div>
              </div>
            </div>

            {/* Attention Required - Center */}
            <div className="col-span-5 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="font-semibold text-sm">⚠️ Attention Required</span>
                <span className="text-gray-400 text-xs">0 items</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400 text-sm">✓ Todo bien</div>
              </div>
            </div>

            {/* Quick Actions - Right */}
            <div className="col-span-3 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
              <span className="font-semibold text-sm text-center mb-4">Quick Actions</span>
              <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                <button className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <span className="text-2xl mb-2">🚌</span>
                  <span className="text-xs font-medium">New Tour</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <span className="text-2xl mb-2">👤</span>
                  <span className="text-xs font-medium">Add User</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <span className="text-2xl mb-2">📊</span>
                  <span className="text-xs font-medium">Reports</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                  <span className="text-2xl mb-2">🚗</span>
                  <span className="text-xs font-medium">Fleet</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full grid grid-cols-12 gap-6">
            {/* Timeline - FIXED: Heading above graph */}
            <div className="col-span-9 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="font-semibold text-sm">Today's Timeline</span>
                <span className="text-gray-400 text-xs">19 tours</span>
              </div>
              <div className="flex-1 flex items-end gap-1">
                {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time, i) => (
                  <div key={time} className="flex-1 text-center">
                    <div 
                      className={`w-full rounded-t ${i < 3 ? 'bg-green-500' : i === 3 ? 'bg-blue-500' : 'bg-gray-200'}`}
                      style={{ height: `${30 + Math.random() * 20}px` }} 
                    />
                    <div className="text-xs text-gray-400 mt-1">{time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fleet Status */}
            <div className="col-span-3 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5">
              <span className="font-semibold text-sm block text-center mb-4">Fleet Status</span>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs">In Use</span>
                  <span className="font-bold text-lg">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Available</span>
                  <span className="font-bold text-lg">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Maintenance</span>
                  <span className="font-bold text-lg text-red-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TestLayout>
  )
}
