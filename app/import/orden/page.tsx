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

// ─── Column mapping step types ────────────────────────────────────────────────
type FieldId = 'hotel' | 'clientName' | 'coupon' | 'pax' | 'confirmation' | 'pickupTime' | 'agency'

interface FieldDef {
  id: FieldId
  label: string
  hint: string
  example?: string
}

const FIELDS: FieldDef[] = [
  { id: 'hotel', label: 'HOTEL', hint: 'Tap the hotel name', example: 'RIU PALACE' },
  { id: 'clientName', label: 'CLIENT', hint: 'Tap the client name', example: 'John Smith' },
  { id: 'coupon', label: 'COUPON', hint: 'Tap the coupon code', example: '´055' },
  { id: 'pax', label: 'PAX', hint: 'Tap the guest count', example: '2' },
  { id: 'pickupTime', label: 'TIME', hint: 'Tap the pickup time', example: '9:30' },
  { id: 'agency', label: 'AGENCY', hint: 'Tap the agency name', example: 'NS VACATIONS' },
]

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
  const [sampleTokens, setSampleTokens] = useState<string[]>([])
  const [sampleReservation, setSampleReservation] = useState<ParsedReservation | null>(null)
  const [mappingStep, setMappingStep] = useState(0)
  const [tokenMapping, setTokenMapping] = useState<Record<FieldId, number[]>>({
    hotel: [],
    clientName: [],
    coupon: [],
    pax: [],
    confirmation: [],
    pickupTime: [],
    agency: [],
  })
  const [currentSelection, setCurrentSelection] = useState<number[]>([])
  
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

      const { data: driverData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
      if (driverData) setDrivers(driverData)

      const { data: guideData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'guide')
      if (guideData) setGuides(guideData)
    }
    loadData()
  }, [])

  // ─── Parse pax string to parts ───────────────────────────────────────────
  function parsePax(pax: string) {
    const parts = pax.split('.').map(p => parseInt(p) || 0)
    return {
      adults: parts[0] || 0,
      children: parts[1] || 0,
      infants: parts[2] || 0,
      total: parts.reduce((sum, n) => sum + n, 0)
    }
  }

  // ─── Match staff names ─────────────────────────────────────────────────────
  function matchStaff(tours: ParsedTour[]): ParsedTour[] {
    return tours.map(tour => {
      const operadorLower = tour.operador.toLowerCase()
      const driverMatch = drivers.find(d => {
        const fullLower = d.full_name.toLowerCase()
        const firstName = fullLower.split(' ')[0]
        return operadorLower === firstName ||
               operadorLower === fullLower ||
               fullLower.includes(operadorLower) ||
               operadorLower.includes(firstName)
      })
      
      const guiaLower = tour.guia?.toLowerCase() || ''
      const guideMatch = guiaLower ? guides.find(g => {
        const fullLower = g.full_name.toLowerCase()
        const firstName = fullLower.split(' ')[0]
        return guiaLower === firstName ||
               guiaLower === fullLower ||
               fullLower.includes(guiaLower) ||
               guiaLower.includes(firstName)
      }) : undefined

      return {
        ...tour,
        operadorId: driverMatch?.id,
        guiaId: guideMatch?.id
      }
    })
  }

  // ─── Apply token mapping to all reservations ───────────────────────────────
  function applyMapping(tours: ParsedTour[], tokenMapping: Record<FieldId, number[]>, sampleTokens: string[]): ParsedTour[] {
    const fieldNames: FieldId[] = ['hotel', 'clientName', 'coupon', 'pax', 'confirmation', 'pickupTime', 'agency']
    
    return tours.map(tour => {
      const newReservations = tour.reservations.map((res, resIdx) => {
        // Build tokens from first reservation to match the sample line structure
        // For subsequent reservations, use API's original parsed values as fallback
        const tokens = resIdx === 0 ? sampleTokens : [
          ...(res.hotel || '').split(/\s+/),
          ...(res.clientName || '').split(/\s+/),
          res.coupon,
          res.pax,
          res.confirmation,
          res.pickupTime,
          ...(res.agency || '').split(/\s+/)
        ].filter(Boolean)
        
        // Handle pax separately since it can be "2" or "2.1.0"
        const paxIndices = tokenMapping['pax']
        let paxStr = res.pax
        if (paxIndices?.length > 0 && tokens[paxIndices[0]]) {
          paxStr = paxIndices.map(i => tokens[i] || '').join(' ')
        }
        const paxData = parsePax(paxStr)
        
        // Build new reservation - use mapping if set, otherwise use original parsed value
        const newRes: Record<string, string | number> = {
          adults: paxData.adults,
          children: paxData.children,
          infants: paxData.infants,
          pax: paxStr,
        }
        
        for (const field of fieldNames) {
          if (field === 'pax') continue
          const indices = tokenMapping[field]
          if (indices && indices.length > 0 && tokens[indices[0]]) {
            // User mapped this field - apply the mapped tokens
            newRes[field] = indices.map(i => tokens[i] || '').join(' ')
          } else {
            // No mapping or first reservation - use original parsed value
            newRes[field] = (res as any)[field] || ''
          }
        }
        
        return {
          ...res,
          ...newRes
        } as ParsedReservation
      })
      
      return { ...tour, reservations: newReservations, totalPax: tour.totalPax }
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
      
      // Get sample from first tour's first reservation
      const firstRes = data.tours[0]?.reservations[0]
      if (firstRes) {
        setSampleReservation(firstRes)
        
        // Build tokens from the raw reservation fields
        // Combine all fields into a displayable token array
        const tokens: string[] = []
        
        // Add hotel words
        if (firstRes.hotel) tokens.push(...firstRes.hotel.split(/\s+/))
        // Add client words
        if (firstRes.clientName) tokens.push(...firstRes.clientName.split(/\s+/))
        // Add coupon
        if (firstRes.coupon) tokens.push(firstRes.coupon)
        // Add HAB (room) - we'll include it in the flow
        // Add pax
        if (firstRes.pax) tokens.push(firstRes.pax)
        // Add confirmation
        if (firstRes.confirmation) tokens.push(firstRes.confirmation)
        // Add time
        if (firstRes.pickupTime) tokens.push(firstRes.pickupTime)
        // Add agency
        if (firstRes.agency) tokens.push(...firstRes.agency.split(/\s+/))
        
        setSampleTokens(tokens.length > 0 ? tokens : ['No', 'data', 'found'])
      }

      const toursWithStaff = matchStaff(data.tours)
      setParsedTours(toursWithStaff)
      setStep(2)
      setMappingStep(0)
      setCurrentSelection([])
      setTokenMapping({
        hotel: [],
        clientName: [],
        coupon: [],
        pax: [],
        confirmation: [],
        pickupTime: [],
        agency: [],
      })
    } catch (err: any) {
      setError('Failed to parse file: ' + (err.message || 'Unknown error'))
    } finally {
      setParsing(false)
    }
  }

  // ─── Token selection handlers ──────────────────────────────────────────────
  const toggleToken = (index: number) => {
    if (currentSelection.includes(index)) {
      setCurrentSelection(currentSelection.filter(i => i !== index))
    } else {
      setCurrentSelection([...currentSelection, index])
    }
  }

  const confirmField = () => {
    const field = FIELDS[mappingStep]
    const newMapping = {
      ...tokenMapping,
      [field.id]: currentSelection
    }
    
    // Move to next step
    if (mappingStep < FIELDS.length - 1) {
      setTokenMapping(newMapping)
      setMappingStep(mappingStep + 1)
      setCurrentSelection([])
    } else {
      // All fields assigned - apply mapping and go to staff step
      setTokenMapping(newMapping)
      const remappedTours = applyMapping(parsedTours, newMapping, sampleTokens)
      setParsedTours(remappedTours)
      setStep(3)
    }
  }

  const skipField = () => {
    setTokenMapping(prev => ({
      ...prev,
      [FIELDS[mappingStep].id]: []
    }))
    
    if (mappingStep < FIELDS.length - 1) {
      setMappingStep(mappingStep + 1)
      setCurrentSelection([])
    } else {
      setStep(3)
    }
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
        } catch {}

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
                <h1 className="text-2xl font-bold text-gray-900">📋 ORDEN Import</h1>
                <p className="text-sm text-gray-500 mt-1">Import your daily operation plan</p>
              </div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
            </div>
          </div>

          {/* Step indicator */}
          <div className="border-8 border-transparent flex-none mb-4">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {[
                { num: 1, label: 'Upload' },
                { num: 2, label: 'Map' },
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
                <h2 className="text-lg font-semibold mb-2">Upload ORDEN File</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Supported: PDF, Excel (.txt), or Text files
                </p>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.text,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="text-5xl mb-3">📄</div>
                  <p className="font-medium text-gray-700">
                    {file ? file.name : 'Tap to select file'}
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
                  className="mt-6 w-full px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium text-lg"
                >
                  {parsing ? '⏳ Parsing...' : 'Parse File →'}
                </button>
              </div>
            )}

            {/* ── Step 2: Token Mapping ── */}
            {step === 2 && sampleReservation && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-500 mb-1">
                    Step {mappingStep + 1} of {FIELDS.length}
                  </div>
                  <h2 className="text-2xl font-bold text-purple-600 mb-2">
                    {FIELDS[mappingStep].label}
                  </h2>
                  <p className="text-gray-500">
                    {FIELDS[mappingStep].hint}
                  </p>
                </div>

                {/* Sample tokens as tappable chips */}
                <div className="border-8 border-transparent bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-3 text-center">TAP TOKENS TO ASSIGN:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {sampleTokens.map((token, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleToken(idx)}
                        className={`px-4 py-3 rounded-xl text-lg font-medium transition-all touch-manipulation
                          ${currentSelection.includes(idx)
                            ? 'bg-purple-600 text-white shadow-lg scale-105'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400'
                          }`}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected value preview */}
                {currentSelection.length > 0 && (
                  <div className="border-8 border-transparent bg-green-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-green-600 mb-1">SELECTED:</p>
                    <p className="text-xl font-bold text-green-700">
                      {currentSelection.map(i => sampleTokens[i]).join(' ')}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="border-8 border-transparent flex gap-3">
                  <button
                    onClick={skipField}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-lg"
                  >
                    Skip
                  </button>
                  <button
                    onClick={confirmField}
                    disabled={currentSelection.length === 0}
                    className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-bold text-lg"
                  >
                    {mappingStep < FIELDS.length - 1 ? 'Next →' : 'Done ✓'}
                  </button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {FIELDS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${
                        idx === mappingStep ? 'bg-purple-600' :
                        idx < mappingStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Staff Assignment ── */}
            {step === 3 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Assign Staff</h2>
                  <p className="text-sm text-gray-500">Driver & guide for each tour</p>
                </div>

                <div className="space-y-4">
                  {parsedTours.map((tour, tourIdx) => (
                    <div key={tourIdx} className="border border-gray-200 rounded-xl p-4">
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
                            <p className="text-xs text-green-600 mt-1">✅ {tour.operador}</p>
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
                            <p className="text-xs text-green-600 mt-1">✅ {tour.guia}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        {tour.reservations.length} reservations • {tour.totalPax} guests
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
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
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
                <h2 className="text-lg font-semibold mb-4">Select Tour Date</h2>
                <p className="text-sm text-gray-500 mb-4">All tours for this date</p>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full text-lg"
                />

                <div className="mt-6 flex gap-3">
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
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Confirm Import</h2>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
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

                <div className="flex gap-3">
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
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
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

                <div className="p-4 bg-blue-50 rounded-xl mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-2">📬 Send Notifications?</p>
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
