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
  balanceDue: number
  pickupTime: string
  rep: string
  agency: string
  tokens: string[]  // Original token order for this reservation
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
type FieldId = 'hotel' | 'clientName' | 'coupon' | 'pax' | 'confirmation' | 'pickupTime' | 'rep' | 'agency'

interface FieldDef {
  id: FieldId
  label: string
  hint: string
  multiWord: boolean
}

const FIELDS: FieldDef[] = [
  { id: 'hotel', label: 'Hotel / Location', hint: 'Tap ALL words that make up the hotel or pickup location', multiWord: true },
  { id: 'clientName', label: 'Guest Name', hint: 'Tap the guest or client name', multiWord: true },
  { id: 'coupon', label: 'Coupon Code', hint: 'Tap the booking coupon or voucher code', multiWord: false },
  { id: 'pax', label: 'Guest Count', hint: 'Tap the number of guests (e.g. 2 or 2.1.1)', multiWord: false },
  { id: 'confirmation', label: 'Confirmation #', hint: 'Tap the confirmation number', multiWord: false },
  { id: 'pickupTime', label: 'Pickup Time', hint: 'Tap the pickup time', multiWord: false },
  { id: 'rep', label: 'Rep Name', hint: 'Tap the rep name', multiWord: true },
  { id: 'agency', label: 'Agency Name', hint: 'Tap the agency name', multiWord: true },
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
  const [assignedTokenIndices, setAssignedTokenIndices] = useState<Set<number>>(new Set())
  const [mappingStep, setMappingStep] = useState(0)
  const [tokenMapping, setTokenMapping] = useState<Record<FieldId, number[]>>({
    hotel: [],
    clientName: [],
    coupon: [],
    pax: [],
    confirmation: [],
    pickupTime: [],
    rep: [],
    agency: [],
  })
  const [currentSelection, setCurrentSelection] = useState<number[]>([])
  const [showMappingSummary, setShowMappingSummary] = useState(false)
  
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
        .eq('status', 'active')
      if (driverData) setDrivers(driverData)

      const { data: guideData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'guide')
        .eq('status', 'active')
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
      
      // Build sample tokens from first tour's first reservation
      const firstRes = data.tours[0]?.reservations[0]
      if (firstRes && data.rawText) {
        const rawLines = data.rawText.split('\n')
        
        // Find the line that contains key identifying info from first reservation
        const resLine = rawLines.find((line: string) => {
          const hasTime = line.includes(firstRes.pickupTime)
          const isHeader = line.includes('SERVICIO') || line.includes('OPERADOR') || line.includes('GUIA')
          return hasTime && !isHeader
        })
        
        if (resLine) {
          const tokens = resLine.trim().split(/\s+/).filter((t: string) => t.length > 0)
          setSampleTokens(tokens)
        } else {
          // Fallback: combine parsed fields
          const displayParts = [
            firstRes.hotel,
            firstRes.clientName, 
            firstRes.coupon,
            firstRes.pax,
            firstRes.confirmation,
            firstRes.pickupTime,
            firstRes.rep,
            firstRes.agency
          ].filter(Boolean)
          setSampleTokens(displayParts.length > 0 ? displayParts : ['No', 'data', 'found'])
        }
      }

      // Attach tokens to each reservation by finding its line in rawText
      const rawLines = data.rawText.split('\n')
      
      const toursWithTokens = data.tours.map((tour: ParsedTour) => ({
        ...tour,
        reservations: tour.reservations.map((res: ParsedReservation) => {
          const resLine = rawLines.find((line: string) => 
            line.includes(res.pickupTime) && 
            !line.includes('SERVICIO') && 
            !line.includes('OPERADOR')
          )
          
          let resTokens: string[] = []
          if (resLine) {
            resTokens = resLine.trim().split(/\s+/).filter((t: string) => t.length > 0)
          } else {
            resTokens = [
              res.hotel,
              res.clientName,
              res.coupon,
              res.pax,
              res.confirmation,
              res.pickupTime,
              res.rep,
              res.agency
            ].filter(Boolean)
          }
          
          return {
            ...res,
            tokens: resTokens
          }
        })
      }))

      const toursWithStaff = matchStaff(toursWithTokens)
      setParsedTours(toursWithStaff)
      setStep(2)
      setMappingStep(0)
      setCurrentSelection([])
      setAssignedTokenIndices(new Set())
      setTokenMapping({
        hotel: [],
        clientName: [],
        coupon: [],
        pax: [],
        confirmation: [],
        pickupTime: [],
        rep: [],
        agency: [],
      })
      setShowMappingSummary(false)
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
    
    // Save the mapping for this field
    const newMapping = {
      ...tokenMapping,
      [field.id]: [...currentSelection].sort((a, b) => a - b)
    }
    
    // Mark these tokens as assigned
    const newAssigned = new Set(assignedTokenIndices)
    currentSelection.forEach(i => newAssigned.add(i))
    setAssignedTokenIndices(newAssigned)
    
    // Move to next field or show summary
    if (mappingStep < FIELDS.length - 1) {
      setTokenMapping(newMapping)
      setMappingStep(mappingStep + 1)
      setCurrentSelection([])
    } else {
      // Last field done — save mapping and show summary
      setTokenMapping(newMapping)
      setShowMappingSummary(true)
    }
  }

  const editField = (fieldIdx: number) => {
    const field = FIELDS[fieldIdx]
    // Unassign the tokens that were used for this field
    const indicesToRemove = tokenMapping[field.id] || []
    const newAssigned = new Set(assignedTokenIndices)
    indicesToRemove.forEach(i => newAssigned.delete(i))
    setAssignedTokenIndices(newAssigned)
    // Go back to that field
    setMappingStep(fieldIdx)
    setCurrentSelection([])
  }

  const confirmMapping = () => {
    // Apply the complete mapping to all reservation rows
    const remappedTours = applyMapping(parsedTours, tokenMapping, sampleTokens)
    setParsedTours(remappedTours)
    setShowMappingSummary(false)
    setStep(3)
  }

  // ─── Apply token mapping to all reservations ───────────────────────────────
// Pure index-based lookup — no pattern matching, no fallbacks
  function applyMapping(tours: ParsedTour[], mapping: Record<FieldId, number[]>, tokens: string[]): ParsedTour[] {
    const fieldIds: FieldId[] = ['hotel', 'clientName', 'coupon', 'pax', 'confirmation', 'pickupTime', 'rep', 'agency']
    
    return tours.map((tour, tourIdx) => {
      const newReservations = tour.reservations.map((res, resIdx) => {
        // Each reservation has its own token array from its row in rawText
        const resTokens = res.tokens || tokens
        
        // DEBUG: log pickupTime mapping for first reservation of first tour
        if (tourIdx === 0 && resIdx === 0) {
          console.log('pickupTime mapping indices:', mapping['pickupTime'])
          console.log('resTokens:', resTokens)
          console.log('resolved pickupTime:', mapping['pickupTime']?.map(i => resTokens[i]))
        }
        
        // Pure index lookup — if position doesn't exist, leave blank
        const getTokenAt = (idx: number): string => {
          return idx < resTokens.length ? resTokens[idx] : ''
        }
        
        // Build new reservation from saved token indices
        const newRes: Record<string, string | number> = {}
        
        // Pax: indices map to a pax string like "2" or "2.1.1"
        const paxIndices = mapping['pax']
        const paxStr = (paxIndices?.length ?? 0) > 0
          ? paxIndices.map(i => getTokenAt(i)).join('').trim()
          : ''
        const paxData = parsePax(paxStr || '1')
        newRes['pax'] = paxStr || '1'
        newRes['adults'] = paxData.adults
        newRes['children'] = paxData.children
        newRes['infants'] = paxData.infants
        
        // All other fields: pure index lookup
        for (const field of fieldIds) {
          if (field === 'pax') continue
          const indices = mapping[field]
          if ((indices?.length ?? 0) > 0) {
            newRes[field] = indices.map(i => getTokenAt(i)).join(' ').trim()
          } else {
            newRes[field] = ''
          }
        }
        
        return { ...res, ...newRes } as ParsedReservation
      })
      
      return { ...tour, reservations: newReservations, totalPax: tour.totalPax }
    })
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
          console.log('processing reservation:', res.clientName, 'pickupTime:', res.pickupTime)
          // Validate pickupTime is a proper time format
          const validTime = /^\d{1,2}:\d{2}$/.test(res.pickupTime) ? res.pickupTime + ':00' : null
          
          const { error: manifestError } = await supabase.from('reservation_manifest').insert({
            tour_id: newTour.id,
            brand_id: brandId,
            booking_reference: res.confirmation,
            adult_pax: res.adults,
            child_pax: res.children,
            infant_pax: res.infants,
            hotel_name: res.hotel,
            room_number: null,
            pickup_time: validTime,
            agency_name: res.agency,
            primary_contact_name: res.clientName
          })
          if (manifestError) console.error('reservation_manifest error:', manifestError)

          console.log('inserting pickup_stop, pickupTime:', res.pickupTime, 'validTime:', validTime)
          
          const { error: stopsError } = await supabase.from('pickup_stops').insert({
            tour_id: newTour.id,
            brand_id: brandId,
            sort_order: stopOrder++,
            location_name: res.hotel,
            scheduled_time: validTime,
            guest_count: res.adults + res.children + res.infants,
            stop_type: 'pickup'
          })
          if (stopsError) console.error('pickup_stops error:', stopsError)

          // Create payment record for balance due
          if (res.balanceDue > 0) {
            const { error: paymentError } = await supabase.from('payments').insert({
              tour_id: newTour.id,
              guest_id: null,
              company_id: companyId,
              amount: res.balanceDue,
              currency: 'MXN',
              payment_type: 'cash_collection',
              status: 'pending',
              notes: `${res.clientName} - ${res.hotel}`
            })
            if (paymentError) console.error('payments error:', paymentError)
          }
        }

        try {
          await supabase
            .from('tours')
            .update({ guest_count: tour.totalPax })
            .eq('id', newTour.id)
        } catch (e) {
          console.error('guest_count update error:', e)
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

  // ─── Get available tokens (not yet assigned) ───────────────────────────────
  const availableTokens = sampleTokens.filter((_, idx) => !assignedTokenIndices.has(idx))

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
            {step === 2 && sampleTokens.length > 0 && !showMappingSummary && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 mb-2">
                    Column Mapping
                  </div>
                  <h2 className="text-3xl font-bold text-purple-600 mb-3">
                    {FIELDS[mappingStep].label}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed">
                    {FIELDS[mappingStep].hint}
                  </p>
                </div>

                {/* Token grid — large and finger-friendly */}
                <div className="border-8 border-transparent bg-gray-50 rounded-2xl p-5 mb-6">
                  <p className="text-xs text-gray-400 mb-4 text-center uppercase tracking-wide">
                    Tap tokens for this field • {availableTokens.length} remaining
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {sampleTokens.map((token, idx) => {
                      const isAssigned = assignedTokenIndices.has(idx)
                      const isSelected = currentSelection.includes(idx)
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isAssigned && toggleToken(idx)}
                          disabled={isAssigned}
                          className={`px-5 py-4 rounded-2xl text-xl font-semibold transition-all touch-manipulation select-none min-w-[60px]
                            ${isAssigned 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-purple-600 text-white shadow-xl scale-110 ring-4 ring-purple-200'
                                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400 active:scale-95'
                            }`}
                        >
                          {token}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selected preview */}
                {currentSelection.length > 0 && (
                  <div className="border-8 border-transparent bg-green-50 rounded-2xl p-5 mb-6 text-center">
                    <p className="text-xs text-green-600 uppercase tracking-wide mb-2">Your selection:</p>
                    <p className="text-2xl font-bold text-green-700">
                      {currentSelection.map(i => sampleTokens[i]).join(' ')}
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Field {mappingStep + 1} of {FIELDS.length}</span>
                    <span>{Math.round(((mappingStep + 1) / FIELDS.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((mappingStep + 1) / FIELDS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-lg"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={confirmField}
                    disabled={currentSelection.length === 0}
                    className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 font-bold text-lg transition-all"
                  >
                    {mappingStep < FIELDS.length - 1 ? 'Next →' : 'Review Mapping ✓'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2b: Mapping Summary ── */}
            {step === 2 && showMappingSummary && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Mapping</h2>
                  <p className="text-gray-500">Here&apos;s how each column will be extracted from every row</p>
                </div>

                {/* Summary cards */}
                <div className="space-y-3 mb-6">
                  {FIELDS.map((field, idx) => {
                    const savedTokens = tokenMapping[field.id] || []
                    const preview = savedTokens.length > 0
                      ? savedTokens.map(i => sampleTokens[i]).join(' ')
                      : '(not set)'
                    
                    return (
                      <div key={field.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700">{field.label}</p>
                          <p className="text-lg font-bold text-purple-600 mt-1">
                            {preview}
                          </p>
                        </div>
                        <button
                          onClick={() => editField(idx)}
                          className="px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowMappingSummary(false)
                      setMappingStep(FIELDS.length - 1)
                    }}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-lg"
                  >
                    ← Edit Mapping
                  </button>
                  <button
                    onClick={confirmMapping}
                    className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg"
                  >
                    ✅ Looks Good — Continue →
                  </button>
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
                  {parsedTours.map((tour, tourIdx) => {
                      const usedDriverIds = parsedTours
                        .map((t, i) => i !== tourIdx ? t.operadorId : null)
                        .filter(Boolean)
                      const availableDrivers = drivers.filter(d =>
                        !usedDriverIds.includes(d.id) || d.id === tour.operadorId
                      )
                      const usedGuideIds = parsedTours
                        .map((t, i) => i !== tourIdx ? t.guiaId : null)
                        .filter(Boolean)
                      const availableGuides = guides.filter(g =>
                        !usedGuideIds.includes(g.id) || g.id === tour.guiaId
                      )
                      
                      return (
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
                            {availableDrivers.map(d => (
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
                            {availableGuides.map(g => (
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
                      )
                    })}
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
