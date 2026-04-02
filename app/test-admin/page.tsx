'use client'

import TestLayout from './TestLayout'

export default function TestPage() {
  return (
    <TestLayout>
      <div className="h-full border-8 border-transparent p-6">
        <div className="h-full flex flex-col border-8 border-transparent gap-6">

          {/* HEADER SECTION */}
          <div className="border-8 border-transparent flex-none">
            {/* Empty spacer */}
          </div>

          {/* KPI CARDS ROW */}
          <div className="border-8 border-transparent flex-none">
            <div className="border-8 border-transparent grid grid-cols-4 gap-6">
              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5 text-center">
                <div className="border-8 border-transparent flex items-baseline justify-center gap-2">
                  <span className="border-8 border-transparent text-3xl font-bold">17/19</span>
                  <span className="border-8 border-transparent text-xs text-green-600 font-medium">LIVE</span>
                </div>
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-xs text-gray-500 uppercase font-medium mt-2">Tours Today</p>
                </div>
              </div>

              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5 text-center">
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-3xl font-bold text-blue-600">132</p>
                </div>
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-xs text-blue-600 uppercase font-medium mt-2">Guests Today</p>
                </div>
              </div>

              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5 text-center">
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-3xl font-bold text-green-600">94%</p>
                </div>
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-xs text-green-600 uppercase font-medium mt-2">On Time %</p>
                </div>
              </div>

              <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5 text-center">
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-3xl font-bold text-red-600">0</p>
                </div>
                <div className="border-8 border-transparent">
                  <p className="border-8 border-transparent text-xs text-red-600 uppercase font-medium mt-2">Incidents</p>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION */}
          <div className="border-8 border-transparent flex-1 min-h-0 overflow-hidden">
            <div className="border-8 border-transparent h-full grid grid-cols-12 gap-6">
              {/* Active Tours + Team - Left */}
              <div className="border-8 border-transparent col-span-4 h-full overflow-auto">
                <div className="border-8 border-transparent space-y-4">
                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5 text-center">
                    <div className="border-8 border-transparent flex items-center justify-center gap-2 mb-2">
                      <span className="border-8 border-transparent text-xs text-gray-500 uppercase font-medium">Active Tours</span>
                      <span className="border-8 border-transparent bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">2 LIVE</span>
                    </div>
                    <div className="border-8 border-transparent">
                      <p className="border-8 border-transparent text-3xl font-bold text-blue-600">2</p>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-white rounded-lg border border-gray-200 p-5">
                    <div className="border-8 border-transparent">
                      <p className="border-8 border-transparent text-xs text-gray-500 uppercase font-medium text-center mb-3">Team Status</p>
                    </div>
                    <div className="border-8 border-transparent grid grid-cols-2 gap-4">
                      <div className="border-8 border-transparent text-center">
                        <div className="border-8 border-transparent">
                          <p className="border-8 border-transparent text-2xl font-bold">2/19</p>
                        </div>
                        <div className="border-8 border-transparent">
                          <p className="border-8 border-transparent text-xs text-gray-500">Guides</p>
                        </div>
                      </div>
                      <div className="border-8 border-transparent text-center">
                        <div className="border-8 border-transparent">
                          <p className="border-8 border-transparent text-2xl font-bold">6</p>
                        </div>
                        <div className="border-8 border-transparent">
                          <p className="border-8 border-transparent text-xs text-gray-500">Vehicles</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-8 border-transparent bg-gray-50 rounded-lg border border-gray-200 p-5">
                    <div className="border-8 border-transparent">
                      <p className="border-8 border-transparent text-xs text-gray-500 text-center">Extra content to test scrolling in this section...</p>
                    </div>
                  </div>
                  <div className="border-8 border-transparent bg-gray-50 rounded-lg border border-gray-200 p-5">
                    <div className="border-8 border-transparent">
                      <p className="border-8 border-transparent text-xs text-gray-500 text-center">More content here...</p>
                    </div>
                  </div>
                  <div className="border-8 border-transparent bg-gray-50 rounded-lg border border-gray-200 p-5">
                    <div className="border-8 border-transparent">
                      <p className="border-8 border-transparent text-xs text-gray-500 text-center">Even more content to force scroll...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attention Required - Center */}
              <div className="border-8 border-transparent col-span-5 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
                <div className="border-8 border-transparent flex items-center justify-center gap-2 mb-4">
                  <span className="border-8 border-transparent font-semibold text-sm">⚠️ Attention Required</span>
                  <span className="border-8 border-transparent text-gray-400 text-xs">0 items</span>
                </div>
                <div className="border-8 border-transparent flex-1 flex items-center justify-center">
                  <div className="border-8 border-transparent text-center text-gray-400 text-sm">✓ Todo bien</div>
                </div>
              </div>

              {/* Quick Actions - Right */}
              <div className="border-8 border-transparent col-span-3 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
                <div className="border-8 border-transparent">
                  <span className="border-8 border-transparent font-semibold text-sm text-center block mb-4">Quick Actions</span>
                </div>
                <div className="border-8 border-transparent flex-1 grid grid-cols-2 gap-4">
                  <div className="border-8 border-transparent">
                    <button className="border-8 border-transparent flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors h-full w-full">
                      <span className="border-8 border-transparent text-2xl mb-2">🚌</span>
                      <span className="border-8 border-transparent text-xs font-medium">New Tour</span>
                    </button>
                  </div>
                  <div className="border-8 border-transparent">
                    <button className="border-8 border-transparent flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors h-full w-full">
                      <span className="border-8 border-transparent text-2xl mb-2">👤</span>
                      <span className="border-8 border-transparent text-xs font-medium">Add User</span>
                    </button>
                  </div>
                  <div className="border-8 border-transparent">
                    <button className="border-8 border-transparent flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors h-full w-full">
                      <span className="border-8 border-transparent text-2xl mb-2">📊</span>
                      <span className="border-8 border-transparent text-xs font-medium">Reports</span>
                    </button>
                  </div>
                  <div className="border-8 border-transparent">
                    <button className="border-8 border-transparent flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors h-full w-full">
                      <span className="border-8 border-transparent text-2xl mb-2">🚗</span>
                      <span className="border-8 border-transparent text-xs font-medium">Fleet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="border-8 border-transparent flex-1 min-h-0 overflow-hidden">
            <div className="border-8 border-transparent h-full grid grid-cols-12 gap-6">
              {/* Timeline */}
              <div className="border-8 border-transparent col-span-9 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
                <div className="border-8 border-transparent flex items-center justify-center gap-2 mb-4">
                  <span className="border-8 border-transparent font-semibold text-sm">Today's Timeline</span>
                  <span className="border-8 border-transparent text-gray-400 text-xs">19 tours</span>
                </div>
                <div className="border-8 border-transparent flex-1 flex items-end gap-1">
                  {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time, i) => (
                    <div key={time} className="border-8 border-transparent flex-1 text-center">
                      <div 
                        className={`border-8 border-transparent w-full rounded-t ${i < 3 ? 'bg-green-500' : i === 3 ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ height: `${30 + Math.random() * 20}px` }} 
                      />
                      <div className="border-8 border-transparent">
                        <p className="border-8 border-transparent text-xs text-gray-400 mt-1">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fleet Status */}
              <div className="border-8 border-transparent col-span-3 h-full overflow-auto bg-white rounded-lg border border-gray-200 p-5">
                <div className="border-8 border-transparent h-full flex flex-col">
                  <div className="border-8 border-transparent">
                    <span className="border-8 border-transparent font-semibold text-sm block text-center mb-6">Fleet Status</span>
                  </div>
                  <div className="border-8 border-transparent flex-1 flex flex-col justify-between">
                    <div className="border-8 border-transparent flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                      <span className="border-8 border-transparent text-sm">In Use</span>
                      <span className="border-8 border-transparent font-bold text-xl">4</span>
                    </div>
                    <div className="border-8 border-transparent flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                      <span className="border-8 border-transparent text-sm">Available</span>
                      <span className="border-8 border-transparent font-bold text-xl">2</span>
                    </div>
                    <div className="border-8 border-transparent flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                      <span className="border-8 border-transparent text-sm">Maintenance</span>
                      <span className="border-8 border-transparent font-bold text-xl text-red-600">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TestLayout>
  )
}
