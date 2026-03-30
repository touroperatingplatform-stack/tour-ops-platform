'use client'

import TestLayout from './TestLayout'

export default function TestPage() {
  return (
    <TestLayout>
      <div className="space-y-6">
        {/* HEADER SECTION - RED BORDER */}
        <div className="border-4 border-red-400 border-dashed p-2">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI CARDS ROW - BLUE BORDER */}
        <div className="border-4 border-blue-400 border-dashed p-2">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase font-medium">Tours Today</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">17/19</span>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-blue-600 uppercase font-medium">Guests Today</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">132</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-green-600 uppercase font-medium">On Time %</p>
              <p className="text-2xl font-bold text-green-600 mt-1">94%</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-red-600 uppercase font-medium">Incidents</p>
              <p className="text-2xl font-bold text-red-600 mt-1">0</p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION - GREEN BORDER */}
        <div className="border-4 border-green-400 border-dashed p-2">
          <div className="grid grid-cols-12 gap-3">
            {/* Active Tours + Team - Left */}
            <div className="col-span-4 grid grid-rows-2 gap-3 border-2 border-purple-300 border-dotted p-1">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase font-medium">Active Tours</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">2 LIVE</span>
                </div>
                <p className="text-3xl font-bold text-blue-600 mt-1">2</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Team Status</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-xl font-bold">2/19</p>
                    <p className="text-xs text-gray-500">Guides</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">6</p>
                    <p className="text-xs text-gray-500">Vehicles</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attention Required - Center */}
            <div className="col-span-5 bg-white rounded-lg border border-gray-200 p-3 flex flex-col border-2 border-orange-300 border-dotted">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">⚠️ Attention Required</span>
                <span className="text-gray-400 text-xs">0 items</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400 py-6 text-sm">✓ Todo bien</div>
              </div>
            </div>

            {/* Quick Actions - Right */}
            <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3 flex flex-col border-2 border-teal-300 border-dotted">
              <span className="font-semibold text-sm mb-2">Quick Actions</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                  <span className="text-xl mb-1">🚌</span>
                  <span className="text-xs font-medium">New Tour</span>
                </button>
                <button className="flex flex-col items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded transition-colors">
                  <span className="text-xl mb-1">👤</span>
                  <span className="text-xs font-medium">Add User</span>
                </button>
                <button className="flex flex-col items-center justify-center p-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
                  <span className="text-xl mb-1">📊</span>
                  <span className="text-xs font-medium">Reports</span>
                </button>
                <button className="flex flex-col items-center justify-center p-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors">
                  <span className="text-xl mb-1">🚗</span>
                  <span className="text-xs font-medium">Fleet</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - YELLOW BORDER */}
        <div className="border-4 border-yellow-400 border-dashed p-2">
          <div className="grid grid-cols-12 gap-3">
            {/* Timeline */}
            <div className="col-span-9 bg-white rounded-lg border border-gray-200 p-3 border-2 border-indigo-300 border-dotted">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Today's Timeline</span>
                <span className="text-gray-400 text-xs">19 tours</span>
              </div>
              <div className="flex items-end gap-1 h-12">
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
            <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3 border-2 border-pink-300 border-dotted">
              <span className="font-semibold text-sm">Fleet Status</span>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs">In Use</span>
                  <span className="font-bold">4</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs">Available</span>
                  <span className="font-bold">2</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs">Maintenance</span>
                  <span className="font-bold text-red-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TestLayout>
  )
}
