'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Region {
  id: string
  name: string
  hotel_count?: number
}

export default function RegionalDataPage() {
  const { t } = useTranslation()
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRegion, setShowAddRegion] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [hotels, setHotels] = useState<any[]>([])
  const [regionName, setRegionName] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success: number, errors: string[]} | null>(null)

  useEffect(() => { loadRegions() }, [])

  async function loadRegions() {
    setLoading(true)
    const { data, error } = await supabase.from('regions').select('*').order('name')
    if (!error && data) {
      const regionsWithCounts = await Promise.all(
        data.map(async (region) => {
          const { count } = await supabase.from('pickup_locations_platform').select('*', { count: 'exact', head: true }).eq('region_id', region.id)
          return { ...region, hotel_count: count || 0 }
        })
      )
      setRegions(regionsWithCounts)
    }
    setLoading(false)
  }

  async function loadHotels(regionId: string) {
    const { data } = await supabase.from('pickup_locations_platform').select('*').eq('region_id', regionId).order('sort_order')
    if (data) setHotels(data)
  }

  async function handleAddRegion() {
    if (!regionName.trim()) return
    const { error } = await supabase.from('regions').insert({ name: regionName })
    if (!error) { setRegionName(''); setShowAddRegion(false); loadRegions() }
  }

  async function handleDeleteRegion(id: string) {
    if (!confirm('Delete this region and all its hotels?')) return
    await supabase.from('regions').delete().eq('id', id)
    loadRegions()
  }

  async function handleImportHotels() {
    if (!importFile || !selectedRegion) return
    setImporting(true); setImportResult(null)
    const errors: string[] = []
    let success = 0
    try {
      const text = await importFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''))
        if (parts.length < 4) { errors.push(`Row ${i}: Not enough columns`); continue }
        const [name, address, lat, lng, zone] = parts
        const latitude = parseFloat(lat), longitude = parseFloat(lng)
        if (!name) { errors.push(`Row ${i}: Missing hotel name`); continue }
        if (isNaN(latitude) || isNaN(longitude)) { errors.push(`Row ${i}: Invalid coordinates for ${name}`); continue }
        const { error } = await supabase.from('pickup_locations_platform').insert({ region_id: selectedRegion.id, name, address: address || null, latitude, longitude, zone: zone || null, sort_order: i })
        if (error) { errors.push(`Row ${i}: ${error.message}`) } else { success++ }
      }
      setImportResult({ success, errors })
      if (success > 0) { loadHotels(selectedRegion.id); loadRegions() }
    } catch (e: any) { setImportResult({ success: 0, errors: [e.message] }) }
    setImporting(false)
  }

  function downloadTemplate() {
    const csv = 'name,address,latitude,longitude,zone\nMarriott Cancun Resort,Blvd Kukulcan KM 14.5,21.1021,-86.7645,Cancun Hotel Zone\nHard Rock Hotel Cancun,Blvd Kukulcan KM 14.5,21.1021,-86.7645,Cancun Hotel Zone'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hotel_import_template.csv'; a.click()
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">
          
          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('regionalData.title') || 'Regional Data'}
                </h1>
              </div>
              <div className="border-8 border-transparent">
                <button onClick={() => setShowAddRegion(true)} className="border-8 border-transparent bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                  <span className="border-8 border-transparent px-4 py-2">+ {t('regionalData.addRegion') || 'Add Region'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Regions List */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-1 overflow-hidden">
            <div className="border-8 border-transparent p-4 h-full flex flex-col">
              <div className="border-8 border-transparent">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('regionalData.regions') || 'Regions'}
                </h2>
              </div>
              
              <div className="border-8 border-transparent flex-1 overflow-y-auto mt-4">
                {loading ? (
                  <div className="border-8 border-transparent">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : regions.length === 0 ? (
                  <div className="border-8 border-transparent border border-dashed border-gray-200 rounded-xl">
                    <div className="border-8 border-transparent p-8 text-center">
                      <p className="text-gray-500">No regions yet. Add your first region to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-8 border-transparent space-y-4">
                    {regions.map(region => (
                      <div key={region.id} className="border-8 border-transparent border border-gray-200 rounded-xl">
                        <div className="border-8 border-transparent p-4 flex justify-between items-start">
                          <div className="border-8 border-transparent">
                            <div className="border-8 border-transparent">
                              <h3 className="font-semibold text-gray-900">{region.name}</h3>
                            </div>
                            <div className="border-8 border-transparent mt-2">
                              <p className="text-sm text-gray-500">{region.hotel_count || 0} hotels</p>
                            </div>
                          </div>
                          <div className="border-8 border-transparent flex gap-2">
                            <div className="border-8 border-transparent">
                              <button onClick={() => { setSelectedRegion(region); setShowImport(true); loadHotels(region.id) }} className="border-8 border-transparent border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
                                <span className="border-8 border-transparent px-3 py-1">{t('regionalData.importHotels') || 'Import Hotels'}</span>
                              </button>
                            </div>
                            <div className="border-8 border-transparent">
                              <button onClick={() => handleDeleteRegion(region.id)} className="border-8 border-transparent border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50">
                                <span className="border-8 border-transparent px-3 py-1">{t('regionalData.delete') || 'Delete'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Region Modal */}
      {showAddRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="border-8 border-transparent p-4 border-b border-gray-100">
              <div className="border-8 border-transparent">
                <h2 className="text-lg font-bold text-gray-900">{t('regionalData.addNewRegion') || 'Add New Region'}</h2>
              </div>
            </div>
            
            <div className="border-8 border-transparent p-4">
              <div className="border-8 border-transparent">
                <div className="border-8 border-transparent">
                  <label className="block text-sm font-medium text-gray-700">Region Name</label>
                </div>
                <div className="border-8 border-transparent mt-2">
                  <input type="text" value={regionName} onChange={e => setRegionName(e.target.value)} placeholder="e.g., Riviera Maya" className="border-8 border-transparent w-full bg-transparent focus:outline-none" />
                </div>
              </div>
            </div>
            
            <div className="border-8 border-transparent p-4 border-t border-gray-100 flex justify-end gap-2">
              <div className="border-8 border-transparent">
                <button onClick={() => setShowAddRegion(false)} className="border-8 border-transparent bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">
                  <span className="border-8 border-transparent px-4 py-2">Cancel</span>
                </button>
              </div>
              <div className="border-8 border-transparent">
                <button onClick={handleAddRegion} disabled={!regionName.trim()} className="border-8 border-transparent bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  <span className="border-8 border-transparent px-4 py-2">Add Region</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Hotels Modal */}
      {showImport && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="border-8 border-transparent p-4 border-b border-gray-100">
              <div className="border-8 border-transparent">
                <h2 className="text-lg font-bold text-gray-900">Import Hotels - {selectedRegion.name}</h2>
              </div>
            </div>
            
            <div className="border-8 border-transparent p-4 border-b border-gray-100">
              <div className="border-8 border-transparent">
                <button onClick={downloadTemplate} className="border-8 border-transparent text-purple-600 hover:text-purple-800 text-sm underline">
                  Download CSV Template
                </button>
              </div>
            </div>
            
            <div className="border-8 border-transparent p-4 flex-1 overflow-y-auto">
              <div className="border-8 border-transparent mb-4">
                <div className="border-8 border-transparent border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="border-8 border-transparent p-4">
                    <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} className="border-8 border-transparent block w-full text-sm text-gray-500" />
                    <div className="border-8 border-transparent mt-2">
                      <p className="text-xs text-gray-500">CSV or Excel file with columns: name, address, latitude, longitude, zone</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-8 border-transparent flex justify-end mb-4">
                <div className="border-8 border-transparent">
                  <button onClick={handleImportHotels} disabled={!importFile || importing} className="border-8 border-transparent bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    <span className="border-8 border-transparent px-4 py-2">{importing ? 'Importing...' : 'Import Hotels'}</span>
                  </button>
                </div>
              </div>
              
              {importResult && (
                <div className="border-8 border-transparent mb-4">
                  <div className={`border-8 border-transparent rounded-xl border ${importResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="border-8 border-transparent p-4">
                      <div className="border-8 border-transparent">
                        <p className="font-semibold text-gray-900">Imported: {importResult.success} hotels</p>
                      </div>
                      {importResult.errors.length > 0 && (
                        <div className="border-8 border-transparent mt-2">
                          <div className="border-8 border-transparent">
                            <p className="font-semibold text-red-600">Errors:</p>
                          </div>
                          <div className="border-8 border-transparent">
                            <ul className="text-sm text-red-600 max-h-40 overflow-y-auto">
                              {importResult.errors.slice(0, 10).map((err, i) => (
                                <li key={i} className="border-8 border-transparent py-1">{err}</li>
                              ))}
                              {importResult.errors.length > 10 && (<li className="border-8 border-transparent py-1">...and {importResult.errors.length - 10} more</li>)}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {hotels.length > 0 && (
                <div className="border-8 border-transparent">
                  <div className="border-8 border-transparent border border-gray-200 rounded-xl overflow-hidden">
                    <div className="border-8 border-transparent bg-gray-50 border-b border-gray-200">
                      <div className="border-8 border-transparent p-3">
                        <h3 className="font-semibold text-gray-900">Hotels in {selectedRegion.name} ({hotels.length})</h3>
                      </div>
                    </div>
                    <div className="border-8 border-transparent max-h-60 overflow-y-auto">
                      <table className="border-8 border-transparent w-full text-sm">
                        <thead className="border-8 border-transparent bg-gray-50 sticky top-0">
                          <tr>
                            <th className="border-8 border-transparent text-left">Name</th>
                            <th className="border-8 border-transparent text-left">Zone</th>
                            <th className="border-8 border-transparent text-right">Lat</th>
                            <th className="border-8 border-transparent text-right">Lng</th>
                          </tr>
                        </thead>
                        <tbody className="border-8 border-transparent divide-y divide-gray-100">
                          {hotels.map(hotel => (
                            <tr key={hotel.id} className="border-8 border-transparent hover:bg-gray-50">
                              <td className="border-8 border-transparent">{hotel.name}</td>
                              <td className="border-8 border-transparent text-gray-500">{hotel.zone}</td>
                              <td className="border-8 border-transparent text-right">{hotel.latitude}</td>
                              <td className="border-8 border-transparent text-right">{hotel.longitude}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-8 border-transparent p-4 border-t border-gray-100 flex justify-end">
              <div className="border-8 border-transparent">
                <button onClick={() => { setShowImport(false); setSelectedRegion(null); setImportFile(null); setImportResult(null) }} className="border-8 border-transparent border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <span className="border-8 border-transparent px-4 py-2">Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
