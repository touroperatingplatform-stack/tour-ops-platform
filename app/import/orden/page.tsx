'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────---
interface ParsedReservation {
  hotel: string
  clientName: string
  coupon: string
  pax: string
  adults: number
  children: number
  infants: number
  confirmation: string
  pickupTime: string
  agency: string
}

interface ParsedTour {
  service: string
  operador: string
  operadorId?: string
  guia: string
  guiaId?: string
  reservations: ParsedReservation[]
  totalPax: number
}

interface StaffMember {
  id: string
  full_name: string
}

interface CreatedTour {
  id: string
  name: string
  date: string
  driver?: string
  guide?: string
  guestCount: number
}

type FieldName = 'hotel' | 'clientName' | 'coupon' | 'pax' | 'confirmation' | 'pickupTime' | 'agency'

// Default column order from the parser
const DEFAULT_MAPPING: Record<FieldName, number> = {
  hotel: 0,
  clientName: 1,
  coupon: 2,
  pax: 3,
  confirmation: 4,
  pickupTime: 5,
  agency: 6
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdenImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [file, setFile] = useState<File | null>(null)
  const [parsedTours, setParsedTours] = useState<ParsedTour[]>([])
  const [rawText, setRawText] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [creating, setCreating] = useState(false)
  const [createdTours, setCreatedTours] = useState<CreatedTour[]>([])
  const [parsing, setParsing] = useState(false)
  
  // Staff
  const [drivers, setDrivers] = useState<StaffMember[]>([])
  const [guides, setGuides] = useState<StaffMember[]>([])
  
  // Column mapping
  const [sampleRow, setSampleRow] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<FieldName, number>>(DEFAULT_MAPPING)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Load company data on mount ────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, brand_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!profile?.company_id) return
      setCompanyId(profile.company_id)
      setBrandId(profile.brand_id)

      // Load drivers
      const { data: driverData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
      if (driverData) setDrivers(driverData)

      // Load guides
      const { data: guideData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'guide')
      if (guideData) setGuides(guideData)
    }
    loadData()
  }, [])

  // ─── Match staff names ─────────────────────────────────────────────────────
  function matchStaff(tours: ParsedTour[]): ParsedTour[] {
    return tours.map(tour => {
      // Driver matching - more flexible
      const operadorLower = tour.operador.toLowerCase()
      const driverMatch = drivers.find(d => {
        const fullLower = d.full_name.toLowerCase()
        const firstName = fullLower.split(' ')[0]
        return operadorLower === firstName ||
               operadorLower === fullLower ||
               fullLower.includes(operadorLower) ||
               operadorLower.includes(firstName)
      })
      
      // Guide matching - more flexible
      const guiaLower = tour.guia.toLowerCase()
      const guideMatch = guides.find(g => {
        const fullLower = g.full_name.toLowerCase()
        const firstName = fullLower.split(' ')[0]
        return guiaLower === firstName ||
               guiaLower === fullLower ||
               fullLower.includes(guiaLower) ||
               guiaLower.includes(firstName)
      })

      return {
        ...tour,
        operadorId: driverMatch?.id,
        guiaId: guideMatch?.id
      }
    })
  }

  // ─── Parse pax string to number ───────────────────────────────────────────
  function parsePax(pax: string): number {
    return parseInt(pax) || 1
  }

  // ─── Apply column mapping to all reservations ──────────────────────────────
  // Mapping lets user swap which parsed field goes to which database column
  function applyMapping(tours: ParsedTour[], mapping: Record<FieldName, number>): ParsedTour[] {
    const fieldNames: FieldName[] = ['hotel', 'clientName', 'coupon', 'pax', 'confirmation', 'pickupTime', 'agency']
    
    return tours.map(tour => {
      const newReservations = tour.reservations.map(res => {
        // Get current values in field order
        const values = [
          res.hotel,
          res.clientName,
          res.coupon,
          res.pax,
          res.confirmation,
          res.pickupTime,
          res.agency
        ]
        
        // Build new reservation by mapping values to their new field positions
        const newRes: Record<string, string> = {}
        for (const field of fieldNames) {
          const valueIndex = mapping[field]
          newRes[field] = values[valueIndex] || ''
        }
        
        // Rebuild reservation with corrected fields
        const paxStr = newRes.pax || '1'
        const adults = parsePax(paxStr)
        
        return {
          ...res,
          hotel: newRes.hotel || '',
          clientName: newRes.clientName || '',
          coupon: newRes.coupon || '',
          pax: paxStr,
          adults,
          children: 0,
          infants: 0,
          confirmation: newRes.confirmation || '',
          pickupTime: newRes.pickupTime || '09:00',
          agency: newRes.agency || ''
        }
      })
      
      const totalPax = newReservations.reduce((sum, r) => sum + parsePax(r.pax), 0)
      return { ...tour, reservations: newReservations, totalPax }
    })
  }

  // ─── Step 1: Handle file upload & parse ────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
  }

  const handleParse = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setParsing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/orden', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to parse file')
        setParsing(false)
        return
      }

      if (!data.tours || data.tours.length === 0) {
        setError('No tours found. Make sure the file has SERVICIO/OPERADOR/GUIA headers.')
        setParsing(false)
        return
      }

      setRawText(data.rawText || '')
      
      // Get sample row from first tour's first reservation
      const firstRes = data.tours[0]?.reservations[0]
      if (firstRes) {
        // The reservation object fields - create a sample array for display
        setSampleRow([
          firstRes.hotel || '',
          firstRes.clientName || '',
          firstRes.coupon || '',
          firstRes.pax || '1',
          firstRes.confirmation || '',
          firstRes.pickupTime || '09:00',
          firstRes.agency || ''
        ])
      }

      // Store parsed tours for now
      const toursWithStaff = matchStaff(data.tours).map(tour => ({
        ...tour,
        totalPax: tour.reservations.reduce((sum, r) => sum + (parseInt(r.pax) || 0), 0)
      }))
      setParsedTours(toursWithStaff)
      setStep(2)
    } catch (err: any) {
      setError('Failed to parse file: ' + (err.message || 'Unknown error'))
    } finally {
      setParsing(false)
    }
  }

  // ─── Update column mapping ─────────────────────────────────────────────────
  const updateMapping = (field: FieldName, newIndex: number) => {
    setColumnMapping(prev => ({ ...prev, [field]: newIndex }))
  }

  // ─── Confirm mapping and continue to Staff Assignment ──────────────────────
  const handleMappingConfirm = () => {
    // Apply mapping to all tours
    const remappedTours = applyMapping(parsedTours, columnMapping)
    setParsedTours(remappedTours)
    setStep(3)
  }

  // ─── Update staff assignment ───────────────────────────────────────────────
  const updateStaff = (tourIdx: number, type: 'driver' | 'guide', staffId: string) => {
    const newTours = [...parsedTours]
    if (type === 'driver') {
      newTours[tourIdx].operadorId = staffId
    } else {
      newTours[tourIdx].guiaId = staffId
    }
    setParsedTours(newTours)
  }

  // ─── Create tours ──────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!companyId) {
      setError('No company selected')
      return
    }

    setCreating(true)
    setError('')

    const created: CreatedTour[] = []

    try {
      for (const tour of parsedTours) {
        const { data: newTour, error: tourErr } = await supabase
          .from('tours')
          .insert({
            company_id: companyId,
            brand_id: brandId,
            name: tour.service,
            tour_date: selectedDate,
            start_time: tour.reservations[0]?.pickupTime || '09:00',
            status: 'scheduled',
            guest_count: tour.totalPax,
            driver_id: tour.operadorId || null,
            guide_id: tour.guiaId || null
          })
          .select('id, name, tour_date')
          .maybeSingle()

        if (tourErr || !newTour) {
          console.error('Tour create error:', tourErr)
          continue
        }

        let stopOrder = 1
        for (const res of tour.reservations) {
          await supabase.from('reservation_manifest').insert({
            tour_id: newTour.id,
            brand_id: brandId,
            booking_reference: res.confirmation,
            adult_pax: res.adults,
            child_pax: res.children,
            infant_pax: res.infants,
            total_pax: res.adults + res.children + res.infants,
            hotel_name: res.hotel,
            room_number: res.coupon,
            pickup_time: res.pickupTime,
            agency_name: res.agency,
            primary_contact_name: res.clientName
          })

          await supabase.from('pickup_stops').insert({
            tour_id: newTour.id,
            brand_id: brandId,
            sort_order: stopOrder++,
            location_name: res.hotel,
            scheduled_time: res.pickupTime,
            guest_count: res.adults + res.children + res.infants,
            stop_type: 'pickup'
          })
        }

        try {
          await supabase.rpc('update_tour_guest_count', { tour_id: newTour.id })
        } catch {
          // RPC may not exist
        }

        created.push({
          id: newTour.id,
          name: newTour.name,
          date: newTour.tour_date,
          driver: tour.operador,
          guide: tour.guia,
          guestCount: tour.totalPax
        })
      }

      setCreatedTours(created)
      setStep(6)
    } catch (err: any) {
      setError(err.message || 'Failed to create tours')
    } finally {
      setCreating(false)
    }
  }

  // ─── Send notifications ────────────────────────────────────────────────────
  const handleNotify = async () => {
    alert('Notifications sent to guides and drivers!')
    router.push('/admin')
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <RoleGuard requiredRole='company_admin'>
      <div className="h-full border-8 border-transparent p-4">
        <div className="h-full flex flex-col border-8 border-transparent">

          {/* Header */}
          <div className="border-8 border-transparent bg-white rounded-xl flex-shrink-0 mb-4">
            <div className="border-8 border-transparent p-4 flex justify-between items-center">
              <div className="border-8 border-transparent">
                <h1 className="text-2xl font-bold text-gray-900">📋 ORDEN Import Wizard</h1>
                <p className="text-sm text-gray-500 mt-1">Import your daily operation plan</p>
              </div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Step indicator */}
          <div className="border-8 border-transparent flex-none mb-4">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {[
                { num: 1, label: 'Upload' },
                { num: 2, label: 'Columns' },
                { num: 3, label: 'Staff' },
                { num: 4, label: 'Date' },
                { num: 5, label: 'Confirm' },
                { num: 6, label: 'Done' }
              ].map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${step === s.num ? 'bg-purple-600 text-white' : 
                      step > s.num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.num ? '✓' : s.num}
                  </span>
                  <span className={step === s.num ? 'text-purple-600 font-medium' : 'text-gray-400'}>{s.label}</span>
                  {i < 5 && <span className="text-gray-300 mx-1">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="border-8 border-transparent flex-1 overflow-auto">

            {/* ── Step 1: Upload ── */}
            {step === 1 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <div className="border-8 border-transparent mb-6">
                  <h2 className="text-lg font-semibold mb-2">Upload ORDEN File</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: <strong>PDF</strong>, <strong>Excel</strong> (export as .txt), or <strong>Text</strong> files
                  </p>
                </div>

                <div
                  className="border-8 border-transparent border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.text,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium text-gray-700">
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'PDF, TXT, CSV'}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleParse}
                  disabled={!file || parsing}
                  className="mt-6 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {parsing ? '⏳ Parsing...' : 'Parse File →'}
                </button>
              </div>
            )}

            {/* ── Step 2: Column Mapping ── */}
            {step === 2 && sampleRow.length > 0 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-4xl">
                <div className="border-8 border-transparent mb-4">
                  <h2 className="text-lg font-semibold">Verify Column Mapping</h2>
                  <p className="text-sm text-gray-500">Sample row from first reservation. Adjust if columns are wrong.</p>
                </div>

                {/* Sample row display */}
                <div className="border-8 border-transparent bg-gray-50 rounded-lg p-4 mb-6 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {sampleRow.map((val, idx) => (
                      <div key={idx} className="px-3 py-2 bg-white border border-gray-200 rounded text-sm min-w-[100px]">
                        <div className="text-xs text-gray-400 mb-1">Col {idx}</div>
                        <div className="font-medium truncate" title={val}>{val || '(empty)'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column mapping dropdowns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {(Object.keys(columnMapping) as FieldName[]).map(field => (
                    <div key={field} className="border border-gray-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-gray-700 mb-2 block">{field}</label>
                      <select
                        value={columnMapping[field]}
                        onChange={(e) => updateMapping(field, parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                      >
                        {sampleRow.map((_, idx) => (
                          <option key={idx} value={idx}>Column {idx}</option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        Current: {sampleRow[columnMapping[field]] || '(empty)'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Raw text preview */}
                {rawText && (
                  <div className="border-8 border-transparent mb-6">
                    <p className="text-xs font-medium text-gray-500 mb-2">RAW TEXT SAMPLE:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {rawText.substring(0, 500)}
                    </pre>
                  </div>
                )}

                <div className="border-8 border-transparent flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleMappingConfirm}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Confirm Mapping →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Staff Assignment ── */}
            {step === 3 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6">
                <div className="border-8 border-transparent mb-4">
                  <h2 className="text-lg font-semibold">Assign Staff</h2>
                  <p className="text-sm text-gray-500">Review and adjust driver/guide assignments</p>
                </div>

                <div className="space-y-4">
                  {parsedTours.map((tour, tourIdx) => (
                    <div key={tourIdx} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{tour.service}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Driver</label>
                          <select
                            value={tour.operadorId || ''}
                            onChange={(e) => updateStaff(tourIdx, 'driver', e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          >
                            <option value="">Select driver...</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                          </select>
                          {tour.operadorId && (
                            <p className="text-xs text-green-600 mt-1">✅ Matched: {tour.operador}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Guide</label>
                          <select
                            value={tour.guiaId || ''}
                            onChange={(e) => updateStaff(tourIdx, 'guide', e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          >
                            <option value="">Select guide...</option>
                            {guides.map(g => (
                              <option key={g.id} value={g.id}>{g.full_name}</option>
                            ))}
                          </select>
                          {tour.guiaId && (
                            <p className="text-xs text-green-600 mt-1">✅ Matched: {tour.guia}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        {tour.reservations.length} reservations • {tour.totalPax} guests
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-8 border-transparent mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Select Date ── */}
            {step === 4 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-md">
                <h2 className="text-lg font-semibold mb-4">Select Tour Date</h2>
                <p className="text-sm text-gray-500 mb-4">All tours will be created for this date</p>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full text-lg"
                />

                <div className="border-8 border-transparent mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 5: Final Confirm ── */}
            {step === 5 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <h2 className="text-lg font-semibold mb-4">Confirm Import</h2>
                
                <div className="border-8 border-transparent bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2"><strong>Summary:</strong></p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {parsedTours.length} tours</li>
                    <li>• {parsedTours.reduce((sum, t) => sum + t.reservations.length, 0)} reservations</li>
                    <li>• {parsedTours.reduce((sum, t) => sum + t.totalPax, 0)} total guests</li>
                    <li>• Date: {selectedDate}</li>
                  </ul>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="border-8 border-transparent flex gap-3">
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {creating ? 'Creating...' : `✅ Create ${parsedTours.length} Tours`}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 6: Done ── */}
            {step === 6 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Tours Created!</h2>
                  <p className="text-gray-500 mb-6">{createdTours.length} tours are ready</p>
                </div>

                <div className="space-y-2 mb-6">
                  {createdTours.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.guestCount} guests • {t.date}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-8 border-transparent p-4 bg-blue-50 rounded-lg mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-2">📬 Send Notifications?</p>
                  <p className="text-xs text-blue-600 mb-4">
                    Notify guides and drivers about their assignments
                  </p>
                  <button
                    onClick={handleNotify}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    🔔 Send Notifications
                  </button>
                </div>

                <Link
                  href="/admin"
                  className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
                >
                  Go to Dashboard →
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
