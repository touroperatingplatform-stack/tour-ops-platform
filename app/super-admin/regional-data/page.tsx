'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Region {
  id: string
  name: string
  timezone: string
  currency: string
  language: string
  status: string
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
  
  // Form state
  const [regionName, setRegionName] = useState('')
  const [regionTimezone, setRegionTimezone] = useState('America/Cancun')
  const [regionCurrency, setRegionCurrency] = useState('MXN')
  const [regionLanguage, setRegionLanguage] = useState('ES,EN')
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success: number, errors: string[]} | null>(null)

  useEffect(() => {
    loadRegions()
  }, [])

  async function loadRegions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name')
    
    if (!error && data) {
      const regionsWithCounts = await Promise.all(
        data.map(async (region) => {
          const { count } = await supabase
            .from('pickup_locations_platform')
            .select('*', { count: 'exact', head: true })
            .eq('region_id', region.id)
          return { ...region, hotel_count: count || 0 }
        })
      )
      setRegions(regionsWithCounts)
    }
    setLoading(false)
  }

  async function loadHotels(regionId: string) {
    const { data } = await supabase
      .from('pickup_locations_platform')
      .select('*')
      .eq('region_id', regionId)
      .order('sort_order')
    if (data) setHotels(data)
  }

  async function handleAddRegion() {
    if (!regionName.trim()) return
    
    const { error } = await supabase
      .from('regions')
      .insert({
        name: regionName,
        timezone: regionTimezone,
        currency: regionCurrency,
        language: regionLanguage
      })
    
    if (!error) {
      setRegionName('')
      setShowAddRegion(false)
      loadRegions()
    }
  }

  async function handleDeleteRegion(id: string) {
    if (!confirm('Delete this region and all its hotels?')) return
    await supabase.from('regions').delete().eq('id', id)
    loadRegions()
  }

  async function handleImportHotels() {
    if (!importFile || !selectedRegion) return
    
    setImporting(true)
    setImportResult(null)
    
    const errors: string[] = []
    let success = 0
    
    try {
      const text = await importFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''))
        
        if (parts.length < 4) {
          errors.push(`Row ${i}: Not enough columns`)
          continue
        }
        
        const [name, address, lat, lng, zone] = parts
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)
        
        if (!name) {
          errors.push(`Row ${i}: Missing hotel name`)
          continue
        }
        
        if (isNaN(latitude) || isNaN(longitude)) {
          errors.push(`Row ${i}: Invalid coordinates for ${name}`)
          continue
        }
        
        const { error } = await supabase
          .from('pickup_locations_platform')
          .insert({
            region_id: selectedRegion.id,
            name,
            address: address || null,
            latitude,
            longitude,
            zone: zone || null,
            sort_order: i
          })
        
        if (error) {
          errors.push(`Row ${i}: ${error.message}`)
        } else {
          success++
        }
      }
      
      setImportResult({ success, errors })
      if (success > 0) {
        loadHotels(selectedRegion.id)
        loadRegions()
      }
    } catch (e: any) {
      setImportResult({ success: 0, errors: [e.message] })
    }
    
    setImporting(false)
  }

  function downloadTemplate() {
    const csv = 'name,address,latitude,longitude,zone\n' +
      'Marriott Cancun Resort,Blvd Kukulcan KM 14.5,21.1021,-86.7645,Cancun Hotel Zone\n' +
      'Hard Rock Hotel Cancun,Blvd Kukulcan KM 14.5,21.1021,-86.7645,Cancun Hotel Zone'
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hotel_import_template.csv'
    a.click()
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="h-full p-4">
        <div className="h-full flex flex-col">
          {/* Page Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="flex justify-between items-center p-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('regionalData.title') || 'Regional Data'}
              </h1>
              <button
                onClick={() => setShowAddRegion(true)}
                className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50"
              >
                + {t('regionalData.addRegion') || 'Add Region'}
              </button>
            </div>
          </div>

          {/* Regions List */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-1 overflow-hidden">
            <div className="p-4 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-100">
                {t('regionalData.regions') || 'Regions'}
              </h2>
              
              <div className="flex-1 overflow-y-auto mt-4">
                {loading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : regions.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-500">No regions yet. Add your first region to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {regions.map(region => (
                      <div key={region.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{region.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {region.hotel_count || 0} hotels • {region.timezone} • {region.currency}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRegion(region)
                                setShowImport(true)
                                loadHotels(region.id)
                              }}
                              className="border border-blue-600 text-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50"
                            >
                              {t('regionalData.importHotels') || 'Import Hotels'}
                            </button>
                            <button
                              onClick={() => handleDeleteRegion(region.id)}
                              className="border border-red-600 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
                            >
                              {t('regionalData.delete') || 'Delete'}
                            </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {t('regionalData.addNewRegion') || 'Add New Region'}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 px-1">Region Name</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={e => setRegionName(e.target.value)}
                  placeholder="e.g., Riviera Maya"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 px-1">Timezone</label>
                <select
                  value={regionTimezone}
                  onChange={e => setRegionTimezone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="America/Cancun">America/Cancun</option>
                  <option value="America/Panama">America/Panama</option>
                  <option value="America/Bogota">America/Bogota</option>
                  <option value="America/Lima">America/Lima</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 px-1">Currency</label>
                <select
                  value={regionCurrency}
                  onChange={e => setRegionCurrency(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="MXN">MXN - Mexican Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="PAB">PAB - Balboa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 px-1">Languages</label>
                <input
                  type="text"
                  value={regionLanguage}
                  onChange={e => setRegionLanguage(e.target.value)}
                  placeholder="e.g., ES,EN"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddRegion(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRegion}
                disabled={!regionName.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Add Region
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Hotels Modal */}
      {showImport && selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="border-8 border-transparent bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Import Hotels - {selectedRegion.name}
              </h2>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={downloadTemplate}
                className="text-purple-600 hover:text-purple-800 text-sm underline"
              >
                Download CSV Template
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 mb-4">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-50 file:text-purple-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                  CSV or Excel file with columns: name, address, latitude, longitude, zone
                </p>
              </div>
              
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleImportHotels}
                  disabled={!importFile || importing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Hotels'}
                </button>
              </div>
              
              {/* Import Results */}
              {importResult && (
                <div className={`p-4 rounded-xl border mb-4 ${importResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                  <p className="font-semibold text-gray-900">Imported: {importResult.success} hotels</p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-red-600">Errors:</p>
                      <ul className="text-sm text-red-600 max-h-40 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>...and {importResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Hotels List */}
              {hotels.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      Hotels in {selectedRegion.name} ({hotels.length})
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-700">Name</th>
                          <th className="text-left p-2 font-medium text-gray-700">Zone</th>
                          <th className="text-right p-2 font-medium text-gray-700">Lat</th>
                          <th className="text-right p-2 font-medium text-gray-700">Lng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {hotels.map(hotel => (
                          <tr key={hotel.id} className="hover:bg-gray-50">
                            <td className="p-2 text-gray-900">{hotel.name}</td>
                            <td className="p-2 text-gray-500">{hotel.zone}</td>
                            <td className="p-2 text-right text-gray-600">{hotel.latitude}</td>
                            <td className="p-2 text-right text-gray-600">{hotel.longitude}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowImport(false)
                  setSelectedRegion(null)
                  setImportFile(null)
                  setImportResult(null)
                }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  )
}
