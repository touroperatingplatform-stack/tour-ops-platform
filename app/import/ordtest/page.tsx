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

// ─── Zone-based mapping ─────────────────────────────────────────────────────────
interface SampleRow {
  tourIdx: number
  resIdx: number
  tokens: string[]
}

interface ZoneMapping {
  // Zone 1: fields before pax, offsets relative to pax (negative = before pax)
  zone1: Record<string, [number, number]>
  // Zone 2: fields between pax and time, offsets relative to pax (positive = after pax)
  zone2: Record<string, [number, number]>
  // Zone 3: fields after time, offsets relative to time (positive = after time)
  zone3: Record<string, [number, number]>
}

// ─── Select two sample rows ─────────────────────────────────────────────────
function selectSampleRows(tours: ParsedTour[], rawText: string): { rowA: SampleRow; rowB: SampleRow } | null {
  if (!rawText) return null
  
  const rawLines = rawText.split('\n')
  
  // Collect all rows where we can find and split a raw line into 6+ individual tokens
  interface RowInfo {
    tourIdx: number
    resIdx: number
    tokens: string[]
    tokenCount: number
  }
  const allRows: RowInfo[] = []
  
  for (let ti = 0; ti < tours.length; ti++) {
    const tour = tours[ti]
    for (let ri = 0; ri < tour.reservations.length; ri++) {
      const res = tour.reservations[ri]
      
      // Find raw line from rawText using confirmation number
      let resLine: string | undefined
      if (res.confirmation) {
        resLine = rawLines.find((line: string) =>
          line.includes(res.confirmation) &&
          !line.includes('SERVICIO') &&
          !line.includes('OPERADOR') &&
          !line.includes('HOTEL')
        )
      }
      
      // Fall back to pickup time + first hotel word
      if (!resLine && res.pickupTime && res.hotel) {
        resLine = rawLines.find((line: string) =>
          line.includes(res.pickupTime) &&
          line.includes(res.hotel.split(' ')[0]) &&
          !line.includes('SERVICIO') &&
          !line.includes('OPERADOR')
        )
      }
      
      if (!resLine) continue
      
      // Split on whitespace into individual word tokens
      const tokens = resLine.trim().split(/\s+/).filter((t: string) => t.length > 0)
      
      // Only accept rows with 6+ individual word tokens
      if (tokens.length >= 6) {
        allRows.push({ tourIdx: ti, resIdx: ri, tokens, tokenCount: tokens.length })
      }
    }
  }
  
  if (allRows.length < 2) return null
  
  // Group by token count to find most common
  const countFreq: Record<number, number> = {}
  for (const row of allRows) {
    countFreq[row.tokenCount] = (countFreq[row.tokenCount] || 0) + 1
  }
  
  // Row A = token count with highest frequency
  let modeCount = 0
  let modeTokenCount = allRows[0].tokenCount
  for (const [tc, freq] of Object.entries(countFreq)) {
    if (freq > modeCount) {
      modeCount = freq
      modeTokenCount = parseInt(tc)
    }
  }
  
  // Find a row with mode token count
  const rowA = allRows.find(r => r.tokenCount === modeTokenCount) || allRows[0]
  
  // Row B = row with token count furthest from Row A
  let maxDiff = 0
  let rowB = allRows.find(r => r !== rowA) || allRows[1]
  for (const r of allRows) {
    if (r === rowA) continue
    const diff = Math.abs(r.tokenCount - rowA.tokenCount)
    if (diff > maxDiff) {
      maxDiff = diff
      rowB = r
    }
  }
  
  return {
    rowA: { tourIdx: rowA.tourIdx, resIdx: rowA.resIdx, tokens: rowA.tokens },
    rowB: { tourIdx: rowB.tourIdx, resIdx: rowB.resIdx, tokens: rowB.tokens }
  }
}

// ─── Build zone mapping from user's tap positions ─────────────────────────────
function buildZoneMapping(
  tokens: string[],
  mapping: Record<FieldId, number[]>,
  paxIdx: number,
  timeIdx: number
): ZoneMapping {
  const zone1: Record<string, [number, number]> = {}
  const zone2: Record<string, [number, number]> = {}
  const zone3: Record<string, [number, number]> = {}
  
  const fieldIds: FieldId[] = ['hotel', 'clientName', 'coupon', 'pax', 'confirmation', 'pickupTime', 'rep', 'agency']
  
  for (const field of fieldIds) {
    const indices = mapping[field] || []
    if (indices.length === 0) continue
    
    if (field === 'pax') {
      zone1[field] = [0, 0]
    } else if (field === 'pickupTime') {
      zone3[field] = [0, 0]
    } else if (indices[0] < paxIdx) {
      // Zone 1: before pax — store absolute token indices
      let endIdx = indices[indices.length - 1]
      // Cap clientName end at coupon start - 1 to avoid picking up coupon tokens
      if (field === 'clientName' && mapping['coupon']?.length > 0) {
        endIdx = Math.min(endIdx, mapping['coupon'][0] - 1)
      }
      zone1[field] = [indices[0], endIdx]
    } else if (indices[0] >= paxIdx && indices[0] <= timeIdx) {
      // Zone 2: between pax and time — offset from pax (positive = after pax)
      const startOffset = indices[0] - paxIdx
      const endOffset = indices[indices.length - 1] - paxIdx
      zone2[field] = [startOffset, endOffset]
    } else if (indices[0] > timeIdx) {
      // Zone 3: after time — offset from time (positive = after time)
      const startOffset = indices[0] - timeIdx
      const endOffset = indices[indices.length - 1] - timeIdx
      zone3[field] = [startOffset, endOffset]
    }
  }
  
  return { zone1, zone2, zone3 }
}

// ─── Apply zone mapping to a row ────────────────────────────────────────────
function applyZoneMapping(
  tokens: string[],
  mapping: ZoneMapping,
  paxIdx: number,
  timeIdx: number
): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  
  // Apply zone 1 fields (before pax — absolute indices, skip pax itself)
  for (const [field, [startIdx, endIdx]] of Object.entries(mapping.zone1)) {
    if (field === 'pax') continue // pax is found by pattern, not zone
    const resolvedTokens: string[] = []
    for (let i = startIdx; i <= endIdx && i < tokens.length; i++) {
      if (i >= 0) resolvedTokens.push(tokens[i])
    }
    result[field] = resolvedTokens.join(' ')
  }
  
  // Apply zone 2 fields (between pax and time)
  for (const [field, [startOff, endOff]] of Object.entries(mapping.zone2 || {})) {
    const startIdx = paxIdx + startOff
    const endIdx = paxIdx + endOff
    const resolvedTokens: string[] = []
    for (let i = startIdx; i <= endIdx && i < tokens.length; i++) {
      if (i >= 0) resolvedTokens.push(tokens[i])
    }
    result[field] = resolvedTokens.join(' ')
  }
  
  // Apply zone 3 fields (after time)
  for (const [field, [startOff, endOff]] of Object.entries(mapping.zone3)) {
    const startIdx = timeIdx + startOff
    const endIdx = timeIdx + endOff
    const resolvedTokens: string[] = []
    for (let i = startIdx; i <= endIdx && i < tokens.length; i++) {
      if (i >= 0) resolvedTokens.push(tokens[i])
    }
    result[field] = resolvedTokens.join(' ')
  }
  
  return result
}

// ─── Apply zone-based mapping to all rows ───────────────────────────────────
function applyZoneBasedMapping(
  tours: ParsedTour[],
  zoneMapping: ZoneMapping,
  sampleTokens: string[]
): ParsedTour[] {
  const timePattern = /^\d{1,2}:\d{2}$/
  
  return tours.map(tour => {
    const newReservations = tour.reservations.map(res => {
      const tokens = res.tokens || sampleTokens
      
      // Find pax and time positions by pattern
      const paxIdx = tokens.findIndex(t => /^\d{1,2}(\.\d{1,2})*$/.test(t) && t.replace(/\D/g,'')?.length <= 2)
      const timeIdx = tokens.findIndex(t => timePattern.test(t))
      
      if (paxIdx < 0 || timeIdx < 0) {
        // Missing anchors — leave all fields blank
        const blank: Record<string, string | number> = {
          hotel: '', clientName: '', coupon: '', pax: '', confirmation: '',
          pickupTime: '', rep: '', agency: '', adults: 0, children: 0, infants: 0
        }
        return { ...res, ...blank } as ParsedReservation
      }
      
      // Apply zone mapping
      const mapped = applyZoneMapping(tokens, zoneMapping, paxIdx, timeIdx)
      
      // Parse pax — found by pattern, not zone mapping
      const paxStr = tokens[paxIdx] || '1'
      const paxData = parsePax(paxStr)
      
      return {
        ...res,
        hotel: mapped['hotel'] as string || '',
        clientName: mapped['clientName'] as string || '',
        coupon: mapped['coupon'] as string || '',
        pax: paxStr,
        confirmation: mapped['confirmation'] as string || '',
        pickupTime: mapped['pickupTime'] as string || '',
        rep: mapped['rep'] as string || '',
        agency: mapped['agency'] as string || '',
        adults: paxData.adults,
        children: paxData.children,
        infants: paxData.infants
      } as ParsedReservation
    })
    
    return { ...tour, reservations: newReservations, totalPax: tour.totalPax }
  })
}

// ─── Auto-detect hotel from pickup_locations_platform ─────────────────────────
async function detectHotelFromDB(tokens: string[], companyId: string | null): Promise<{ hotelName: string; startIdx: number; endIdx: number } | null> {
  if (tokens.length === 0) return null
  
  const { data: hotels } = await supabase
    .from('pickup_locations_platform')
    .select('name')
    .eq('status', 'active')
    .limit(500)
  
  if (!hotels || hotels.length === 0) return null
  
  // Try 1, 2, 3, 4 word combinations from the start of the row
  for (let numWords = 1; numWords <= 4; numWords++) {
    if (numWords > tokens.length) break
    const candidate = tokens.slice(0, numWords).join(' ').toUpperCase().trim()
    const match = hotels.find(loc => 
      loc.name.toUpperCase().replace(/\s+/g, ' ').trim() === candidate
    )
    if (match) {
      return { hotelName: tokens.slice(0, numWords).join(' '), startIdx: 0, endIdx: numWords - 1 }
    }
  }
  
  return null
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdenImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)

  // Activity assignment state
  const [companyActivities, setCompanyActivities] = useState<{id: string, name: string}[]>([])
  const [servicioPatterns, setServicioPatterns] = useState<Record<string, {activities: string[], isNew: boolean}>>({})
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
  const [sampleRows, setSampleRows] = useState<{ rowA: SampleRow; rowB: SampleRow } | null>(null)
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
  const [zoneMapping, setZoneMapping] = useState<ZoneMapping | null>(null)
  const [showRowBVerification, setShowRowBVerification] = useState(false)
  const [verifiedMapping, setVerifiedMapping] = useState<ZoneMapping | null>(null)
  const [autoDetectedHotel, setAutoDetectedHotel] = useState<{ hotelName: string; startIdx: number; endIdx: number } | null>(null)
  
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

      // Load system activities + company activities
      const [{ data: systemActivities }, { data: companyActivities }] = await Promise.all([
        supabase
          .from('activities')
          .select('id, name')
          .is('company_id', null)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('activities')
          .select('id, name')
          .eq('company_id', profile.company_id)
          .eq('is_active', true)
          .order('name')
      ])
      
      const allActivities = [
        ...(systemActivities || []),
        ...(companyActivities || [])
      ]
      setCompanyActivities(allActivities)

      // Load servicio patterns
      const { data: patternsData } = await supabase
        .from('servicio_patterns')
        .select('servicio_name, normalized_name, activities')
        .eq('company_id', profile.company_id)
      
      if (patternsData) {
        const patterns: Record<string, { activities: string[], isNew: boolean }> = {}
        patternsData.forEach(p => {
          // Store by both original and normalized name for lookup
          patterns[p.servicio_name] = { activities: p.activities || [], isNew: false }
          if (p.normalized_name) {
            patterns[p.normalized_name] = { activities: p.activities || [], isNew: false }
          }
        })
        setServicioPatterns(patterns)
      }

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
          // Try to find this reservation's line using confirmation (unique per reservation)
          let resLine: string | undefined
          if (res.confirmation) {
            resLine = rawLines.find((line: string) =>
              res.confirmation &&
              line.includes(res.confirmation) &&
              !line.includes('SERVICIO') &&
              !line.includes('OPERADOR') &&
              !line.includes('HOTEL')
            )
          }
          
          // Fall back to matching both pickup time AND hotel name
          if (!resLine && res.pickupTime && res.hotel) {
            resLine = rawLines.find((line: string) =>
              line.includes(res.pickupTime) &&
              line.includes(res.hotel.split(' ')[0]) &&
              !line.includes('SERVICIO') &&
              !line.includes('OPERADOR')
            )
          }
          
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
      
      // Select two sample rows for mapping (always re-extracts from rawText)
      const rows = selectSampleRows(toursWithStaff, data.rawText)
      if (rows) {
        setSampleRows(rows)
        setSampleTokens(rows.rowA.tokens)
        console.log('Row A tokens:', rows.rowA.tokens)
        console.log('Row B tokens:', rows.rowB.tokens)
        
        // Auto-detect hotel from pickup_locations_platform
        const detected = await detectHotelFromDB(rows.rowA.tokens, companyId)
        setAutoDetectedHotel(detected)
        console.log('auto-detected hotel:', detected)
        
        // Pre-fill hotel indices if auto-detected
        if (detected) {
          const hotelIndices = Array.from(
            { length: detected.endIdx - detected.startIdx + 1 },
            (_, i) => detected.startIdx + i
          )
          setTokenMapping(prev => ({ ...prev, hotel: hotelIndices }))
          setAssignedTokenIndices(prev => new Set([...prev, ...hotelIndices]))
        }
      }
      
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
      setShowRowBVerification(false)
      setZoneMapping(null)
      setVerifiedMapping(null)
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
    
    // For hotel step, use auto-detected indices if current selection is empty
    let indicesToSave = currentSelection
    if (field.id === 'hotel' && autoDetectedHotel && currentSelection.length === 0) {
      indicesToSave = Array.from(
        { length: autoDetectedHotel.endIdx - autoDetectedHotel.startIdx + 1 },
        (_, i) => autoDetectedHotel.startIdx + i
      )
    }
    
    // Save the mapping for this field
    const newMapping = {
      ...tokenMapping,
      [field.id]: [...indicesToSave].sort((a, b) => a - b)
    }
    
    // Mark these tokens as assigned
    const newAssigned = new Set(assignedTokenIndices)
    indicesToSave.forEach(i => newAssigned.add(i))
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
    console.log('confirmMapping called')
    // Build zone mapping from user's tap positions on Row A
    const rowATokens = sampleRows?.rowA.tokens || sampleTokens
    console.log('rowATokens:', rowATokens)
    const paxIdx = rowATokens.findIndex(t => /^\d{1,2}(\.\d{1,2})*$/.test(t) && t.replace(/\D/g,'')?.length <= 2)
    const timeIdx = rowATokens.findIndex(t => /^\d{1,2}:\d{2}$/.test(t))
    console.log('paxIdx:', paxIdx, 'timeIdx:', timeIdx)
    
    if (paxIdx < 0 || timeIdx < 0) {
      console.log('confirmMapping error: pax or time not found')
      setError('Could not find pax or time anchors in Row A. Please re-map.')
      return
    }
    
    // Include current selection (last field) in the mapping passed to buildZoneMapping
    const lastFieldId = FIELDS[mappingStep]?.id
    const mappingWithCurrent = lastFieldId && currentSelection.length > 0
      ? { ...tokenMapping, [lastFieldId]: currentSelection }
      : tokenMapping
    
    const zm = buildZoneMapping(rowATokens, mappingWithCurrent, paxIdx, timeIdx)
    console.log('mappingWithCurrent agency:', JSON.stringify(mappingWithCurrent.agency))
    console.log('zone2:', JSON.stringify(zm.zone2))
    console.log('zone3:', JSON.stringify(zm.zone3))
    console.log('zone mapping:', JSON.stringify(zm))
    
    setZoneMapping(zm)
    setShowMappingSummary(false)
    setShowRowBVerification(true)
    console.log('confirmMapping complete, showRowBVerification will be true')
    // Next: verify on Row B
  }

  const confirmRowB = () => {
    if (!zoneMapping) return
    
    // Apply zone mapping to all rows
    const remappedTours = applyZoneBasedMapping(parsedTours, zoneMapping, sampleTokens)
    setParsedTours(remappedTours)
    setVerifiedMapping(zoneMapping)
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

    console.log('handleConfirm started, tours:', parsedTours.length)
    parsedTours.forEach((t, i) => console.log(`tour ${i} (${t.operador}):`, t.reservations.map(r => r.clientName)))
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

        console.log('tour created:', newTour?.id, 'error:', tourErr)

        // Group reservations by unique pickup location + time to create stops
        const pickupGroups: Record<string, { hotel: string, time: string, reservations: typeof tour.reservations }> = {}
        
        for (const res of tour.reservations) {
          if (!res.pickupTime || !res.clientName) {
            console.log('skipping reservation: missing pickupTime or clientName', res.pickupTime, res.clientName)
            continue
          }
          
          const validTime = /^\d{1,2}:\d{2}$/.test(res.pickupTime) ? res.pickupTime + ':00' : null
          const key = `${res.hotel}::${validTime}`
          
          if (!pickupGroups[key]) {
            pickupGroups[key] = { hotel: res.hotel, time: validTime!, reservations: [] }
          }
          pickupGroups[key].reservations.push(res)
        }
        
        // Create pickup_stops first
        const stopMap: Record<string, string> = {} // key -> stop_id
        let stopOrder = 1
        
        for (const [key, group] of Object.entries(pickupGroups)) {
          const totalGuests = group.reservations.reduce((sum, r) => sum + r.adults + r.children + r.infants, 0)
          
          const { data: stopData, error: stopsError } = await supabase
            .from('pickup_stops')
            .insert({
              tour_id: newTour.id,
              brand_id: brandId,
              sort_order: stopOrder++,
              location_name: group.hotel,
              scheduled_time: group.time,
              guest_count: totalGuests,
              stop_type: 'pickup'
            })
            .select('id')
            .single()
          
          if (stopsError) {
            console.error('pickup_stops error:', stopsError)
            continue
          }
          
          stopMap[key] = stopData.id
          console.log('Created stop:', stopData.id, 'for', group.hotel, group.time)
        }
        
        // Create reservation_manifest with pickup_stop_id linked
        for (const res of tour.reservations) {
          if (!res.pickupTime || !res.clientName) continue
          
          const validTime = /^\d{1,2}:\d{2}$/.test(res.pickupTime) ? res.pickupTime + ':00' : null
          const key = `${res.hotel}::${validTime}`
          const pickupStopId = stopMap[key]
          
          const { error: manifestError } = await supabase.from('reservation_manifest').insert({
            tour_id: newTour.id,
            brand_id: brandId,
            pickup_stop_id: pickupStopId,
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

        // Save servicio pattern and create activities
        const pattern = servicioPatterns[tour.service]
        if (pattern && pattern.activities.length > 0) {
          // Save pattern for future imports
          const normalizedName = tour.service.toLowerCase().trim()
          await supabase.from('servicio_patterns').upsert({
            company_id: companyId,
            servicio_name: tour.service,
            normalized_name: normalizedName,
            activities: pattern.activities,
            duration_minutes: pattern.activities.length * 60
          }, { onConflict: 'company_id, normalized_name' })

          // Create activity stops and tour_activities
          const lastPickupStop = await supabase
            .from('pickup_stops')
            .select('sort_order, scheduled_time')
            .eq('tour_id', newTour.id)
            .eq('stop_type', 'pickup')
            .order('sort_order', { ascending: false })
            .limit(1)
            .maybeSingle()

          let activityOrder = (lastPickupStop.data?.sort_order || 0) + 1
          let activityTime = lastPickupStop.data?.scheduled_time || '10:00'

          for (const activityId of pattern.activities) {
            const activity = companyActivities.find(a => a.id === activityId)
            if (!activity) continue

            // Create activity stop
            const { data: activityStop } = await supabase
              .from('pickup_stops')
              .insert({
                tour_id: newTour.id,
                brand_id: brandId,
                sort_order: activityOrder++,
                location_name: activity.name,
                scheduled_time: activityTime,
                guest_count: tour.totalPax,
                stop_type: 'activity'
              })
              .select('id')
              .single()

            if (activityStop) {
              // Create tour_activity record
              await supabase.from('tour_activities').insert({
                tour_id: newTour.id,
                activity_id: activityId,
                sort_order: activityOrder - 1,
                scheduled_time: activityTime,
                status: 'pending'
              })
            }

            // Increment time for next activity (add 90 min default)
            const [hours, minutes] = activityTime.split(':').map(Number)
            const nextTime = new Date(2000, 0, 1, hours, minutes + 90)
            activityTime = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`
          }
          
          // Generate combined equipment checklist for this tour
          await supabase.rpc('generate_tour_equipment_checklist', {
            p_tour_id: newTour.id
          })
        }
      }

      setCreatedTours(created)
      setStep(7)
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
                    {mappingStep === 0 && autoDetectedHotel && (
                      <span className="ml-3 text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full align-middle">
                        ✓ Auto-detected: {autoDetectedHotel.hotelName}
                      </span>
                    )}
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
                    onClick={mappingStep < FIELDS.length - 1 ? confirmField : confirmMapping}
                    disabled={
                      (mappingStep === 0 && (!autoDetectedHotel && currentSelection.length === 0)) ||
                      (mappingStep > 0 && currentSelection.length === 0)
                    }
                    className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 font-bold text-lg transition-all"
                  >
                    {mappingStep < FIELDS.length - 1 ? 'Next →' : 'Review Mapping ✓'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2b: Row B Verification ── */}
            {step === 2 && showRowBVerification && sampleRows && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify on Different Row</h2>
                  <p className="text-gray-500">Here&apos;s how the mapping looks on a structurally different row</p>
                </div>

                {/* Row B preview */}
                {(() => {
                  const rowB = sampleRows.rowB
                  const rowA = sampleRows.rowA
                  const timePattern = /^\d{1,2}:\d{2}$/
                  const paxIdx = rowB.tokens.findIndex(t => /^\d{1,2}(\.\d{1,2})*$/.test(t) && t.replace(/\D/g,'')?.length <= 2)
                  const timeIdx = rowB.tokens.findIndex(t => timePattern.test(t))
                  
                  console.log('zone mapping:', JSON.stringify(zoneMapping))
                  console.log('Row B tokens:', rowB.tokens)
                  console.log('Row B pax position:', paxIdx, 'time position:', timeIdx)
                  if (zoneMapping?.zone1) {
                    console.log('zone1 hotel offsets:', zoneMapping.zone1.hotel, 'resolves to:', paxIdx - (zoneMapping.zone1.hotel?.[0] || 0), paxIdx - (zoneMapping.zone1.hotel?.[1] || 0))
                    console.log('zone1 coupon offsets:', zoneMapping.zone1.coupon, 'resolves to:', paxIdx - (zoneMapping.zone1.coupon?.[0] || 0))
                    console.log('zone1 clientName offsets:', zoneMapping.zone1.clientName, 'resolves to:', paxIdx - (zoneMapping.zone1.clientName?.[0] || 0))
                    console.log('zone2 agency offsets:', zoneMapping.zone2?.agency, 'resolves to:', paxIdx + (zoneMapping.zone2?.agency?.[0] || 0))
                    console.log('zone3 agency offsets:', zoneMapping.zone3?.agency, 'resolves to:', timeIdx + (zoneMapping.zone3?.agency?.[0] || 0))
                  }
                  
                  // Use zone mapping from Row A, or rebuild from Row A if not set
                  const zm = zoneMapping || buildZoneMapping(
                    rowA.tokens,
                    tokenMapping,
                    rowA.tokens.findIndex(t => /^\d+(\.\d+)*$/.test(t)),
                    rowA.tokens.findIndex(t => timePattern.test(t))
                  )
                  
                  // Apply zone mapping to Row B
                  const mapped = applyZoneMapping(rowB.tokens, zm, paxIdx, timeIdx)
                  // Add pax since applyZoneMapping skips it (found by pattern instead)
                  ;(mapped as any)['pax'] = rowB.tokens[paxIdx] || ''
                  
                  return (
                    <div className="space-y-3 mb-6">
                      <div className="bg-gray-100 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-2">Row B tokens ({rowB.tokens.length} tokens):</p>
                        <p className="font-mono text-sm text-gray-700">{rowB.tokens.join(' ')}</p>
                      </div>
                      
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Field</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {FIELDS.map(field => (
                              <tr key={field.id}>
                                <td className="px-4 py-2 text-gray-600">{field.label}</td>
                                <td className="px-4 py-2 font-medium text-purple-700">
                                  {(mapped[field.id] as string) || <span className="text-gray-400 italic">empty</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRowBVerification(false)
                      setMappingStep(FIELDS.length - 1)
                    }}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-lg"
                  >
                    ← Fix it
                  </button>
                  <button
                    onClick={confirmRowB}
                    className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg"
                  >
                    ✅ Looks correct
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
                    onClick={() => {
                      // Initialize activity assignments - USE EXISTING patterns if available
                      const initialAssignments: Record<string, { activities: string[], isNew: boolean }> = {}
                      parsedTours.forEach(tour => {
                        // Check by original service name (how it's stored in DB)
                        if (servicioPatterns[tour.service] && servicioPatterns[tour.service].activities.length > 0) {
                          initialAssignments[tour.service] = { 
                            activities: [...servicioPatterns[tour.service].activities], 
                            isNew: false 
                          }
                        } else {
                          initialAssignments[tour.service] = { activities: [], isNew: true }
                        }
                      })
                      setServicioPatterns(prev => ({ ...prev, ...initialAssignments }))
                      setStep(4)
                    }}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Activity Assignment ── */}
            {step === 4 && (
              <div className="border-8 border-transparent bg-white rounded-xl border border-gray-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Assign Activities</h2>
                  <p className="text-sm text-gray-500">Define activities for each tour (minimum 1 per tour)</p>
                </div>

                <div className="space-y-6">
                  {parsedTours.map((tour, tourIdx) => {
                    const pattern = servicioPatterns[tour.service] || { activities: [], isNew: true }
                    const selectedActivities = companyActivities.filter(a => pattern.activities.includes(a.id))

                    return (
                      <div key={tourIdx} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{tour.service}</h3>
                          {pattern.isNew ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">New Tour</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Saved Pattern</span>
                          )}
                        </div>

                        {/* Selected Activities with Checklist Info */}
                        <div className="space-y-2 mb-3">
                          {selectedActivities.map((activity, idx) => (
                            <div key={activity.id} className="bg-gray-50 rounded-lg px-3 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{idx + 1}. {activity.name}</span>
                                <button
                                  onClick={() => {
                                    const newActivities = pattern.activities.filter(id => id !== activity.id)
                                    setServicioPatterns(prev => ({
                                      ...prev,
                                      [tour.service]: { ...pattern, activities: newActivities }
                                    }))
                                  }}
                                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <a 
                                  href={`/admin/activities`}
                                  target="_blank"
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  Manage activities →
                                </a>
                              </div>
                            </div>
                          ))}
                          {selectedActivities.length === 0 && (
                            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                              ⚠️ No activities assigned. Add at least 1 activity.
                            </p>
                          )}
                        </div>

                        {/* Add Activity */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return
                            const activityId = e.target.value
                            if (!pattern.activities.includes(activityId)) {
                              setServicioPatterns(prev => ({
                                ...prev,
                                [tour.service]: {
                                  ...pattern,
                                  activities: [...pattern.activities, activityId]
                                }
                              }))
                            }
                            e.target.value = ''
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                        >
                          <option value="">+ Add Activity...</option>
                          {companyActivities
                            .filter(a => !pattern.activities.includes(a.id))
                            .map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        {/* Save Pattern Toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pattern.isNew || pattern.activities.length > 0}
                            onChange={(e) => {
                              // Always save if activities exist
                              if (pattern.activities.length > 0) {
                                setServicioPatterns(prev => ({
                                  ...prev,
                                  [tour.service]: { ...pattern, isNew: false }
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                            disabled={pattern.activities.length === 0}
                          />
                          Save as pattern for future imports
                        </label>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      // Validate all tours have at least 1 activity
                      const missingActivities = parsedTours.filter(tour => {
                        const pattern = servicioPatterns[tour.service]
                        return !pattern || pattern.activities.length === 0
                      })
                      if (missingActivities.length > 0) {
                        alert(`Please add at least 1 activity for: ${missingActivities.map(t => t.service).join(', ')}`)
                        return
                      }
                      setStep(5)
                    }}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 5: Select Date ── */}
            {step === 5 && (
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
                    onClick={() => setStep(4)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 6: Final Confirm ── */}
            {step === 6 && (
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

            {/* ── Step 7: Done ── */}
            {step === 7 && (
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
