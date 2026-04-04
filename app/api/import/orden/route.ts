import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'

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

// ─── Parse PAX format ───────────────────────────────────────────────────────
function parsePax(raw: string) {
  const parts = raw.split('.').map(n => parseInt(n) || 0)
  return {
    adults: parts[0] || 0,
    children: parts[1] || 0,
    infants: parts[2] || 0,
    total: parts.reduce((sum, n) => sum + n, 0)
  }
}

// ─── Parse ORDEN text ──────────────────────────────────────────────────────
function parseOrdenText(text: string): ParsedTour[] {
  const tours: ParsedTour[] = []
  
  // Step 1: Split by SERVICIO: into groups
  const groups = text.split(/SERVICIO:/g).slice(1)
  console.log('Groups found:', groups.length)
  groups.forEach((g, i) => console.log('Group', i, 'first line:', g.split('\n')[0]))
  
  let groupIdx = 0
  
  for (const group of groups) {
    const lines = group.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    
    // Step 2: Parse tour header (first line)
    const headerMatch = lines[0].match(/^(.+?)\s+OPERADOR:\s*(.+?)\s+GUIA:\s*(.+)$/i)
    if (!headerMatch) continue
    
    const tour: ParsedTour = {
      service: headerMatch[1].trim(),
      operador: headerMatch[2].trim(),
      guia: headerMatch[3].trim(),
      reservations: [],
      totalPax: 0
    }
    
    // Step 3: Find reservation lines (have time and aren't header/footer)
    const reservationLine = /^\s*\S+.*\d+:\d+.*$/
    
    // DEBUG: log raw pax token for first reservation of each group
    const firstResLine = lines.slice(1).find(l => reservationLine.test(l) && !l.includes('HOTEL') && !l.includes('TOTAL') && !l.includes('---'))
    if (firstResLine) {
      const paxMatch = firstResLine.match(/\b\d{3,4}\s+(\d{1,2}(?:\.\d+)*)\s+(?:[`´']\S+|\d+[A-Z]+|\d+\+\d+)/)
      const firstPax = paxMatch ? paxMatch[1] : 'NOT_FOUND'
      console.log('Group', groupIdx, 'first reservation pax raw token:', firstPax)
    }
    groupIdx++
    
    for (const line of lines.slice(1)) {
      if (!reservationLine.test(line)) continue
      if (line.includes('HOTEL') || line.includes('TOTAL') || line.includes('---')) continue
      
      // Line format: HOTEL CLIENT COUPON HAB PAX CONF TOUR_TYPE IN/ES TIME REP AGENCY
      // Example: RIU LUPITA BEATRICE DURRANI ´055 2930 2 ´070 TCA IN 7:50 SUSANA O NS VACATIONS
      
      // Find all tokens - split by whitespace
      const tokens = line.trim().split(/\s+/)
      
      // Find indices of key anchors
      const firstCouponIdx = tokens.findIndex(t => t.startsWith('´') || /^\d{4,}$/.test(t))
      const secondCouponIdx = tokens.findIndex((t, i) => i > firstCouponIdx && (t.startsWith('´') || /^\d{4,}$/.test(t)))
      const timeIdx = tokens.findIndex(t => /\d{1,2}:\d{2}/.test(t))
      
      // Extract fields using indices
      // Hotel + Client = tokens before first coupon
      const hotelClientTokens = firstCouponIdx > 0 ? tokens.slice(0, firstCouponIdx) : []
      
      // Find first number in hotel+client to split hotel from client
      const firstNumIdx = hotelClientTokens.findIndex(t => /^\d+$/.test(t))
      
      let hotel = ''
      let clientName = ''
      if (firstNumIdx > 0) {
        // Everything before first number = hotel
        hotel = hotelClientTokens.slice(0, firstNumIdx).join(' ')
        // Everything after first number = client name
        clientName = hotelClientTokens.slice(firstNumIdx).join(' ')
      } else {
        hotel = hotelClientTokens.join(' ')
      }
      
      // Coupon is first coupon token
      const coupon = firstCouponIdx > 0 ? tokens[firstCouponIdx].replace('´', '') : ''
      
      // HAB (room number) is between first coupon and pax
      const hab = firstCouponIdx > 0 && firstCouponIdx + 1 < (secondCouponIdx > 0 ? secondCouponIdx : timeIdx) 
        ? tokens[firstCouponIdx + 1] : ''
      
      // Pax: find 3-4 digit HAB, then pax (1-2 digits or dotted), then confirmation
      // Confirmation can be: ´-prefixed (´070), lettered (2OO), or numeric-only (188+1200)
      const paxMatch = line.match(/\b\d{3,4}\s+(\d{1,2}(?:\.\d+)*)\s+(?:[`´']\S+|\d+[A-Z]+|\d+\+\d+)/)
      const paxStr = paxMatch ? paxMatch[1] : '1'
      
      // Confirmation is second coupon token
      const confirmation = secondCouponIdx > 0 ? tokens[secondCouponIdx].replace('´', '') : ''
      
      // Tour type is after second coupon
      const tourTypeIdx = secondCouponIdx > 0 ? secondCouponIdx + 1 : timeIdx - 3
      const tourType = tokens[tourTypeIdx] || ''
      
      // IN/ES is after tour type
      const inOutIdx = tourTypeIdx + 1
      const inOut = tokens[inOutIdx] || ''
      
      // Time
      const pickupTime = timeIdx > 0 ? tokens[timeIdx] : '09:00'
      
      // Agency: last word(s) ending in VACATIONS, CHARTERS, or TOURS
      const agencyMatch = line.match(/(\b\w+\s+)?(VACATIONS|CHARTERS|TOURS)\s*$/i)
      const agency = agencyMatch ? agencyMatch[0].trim() : ''
      
      // Rep: everything between time and agency
      const timeAndAfter = line.match(/\d+:\d+\s+(.+)$/)?.[1] || ''
      const rep = timeAndAfter.replace(agency, '').trim()
      
      const paxData = parsePax(paxStr)
      tour.reservations.push({
        hotel,
        clientName,
        coupon: coupon.startsWith('´') ? coupon : '´' + coupon,
        pax: paxStr,
        adults: paxData.adults,
        children: paxData.children,
        infants: paxData.infants,
        confirmation,
        pickupTime,
        agency
      })
      tour.totalPax += paxData.adults + paxData.children + paxData.infants
    }
    
    if (tour.reservations.length > 0) {
      tours.push(tour)
    }
  }

  return tours
}

// POST /api/import/orden
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let text: string

    if (file.name.toLowerCase().endsWith('.pdf')) {
      const buffer = await file.arrayBuffer()
      const { text: extractedText } = await extractText(new Uint8Array(buffer))
      text = Array.isArray(extractedText) ? extractedText.join('\n') : extractedText

      if (!text || text.length < 50) {
        return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 })
      }
    } else {
      text = await file.text()
    }

    console.log('RAW TEXT:', text.substring(0, 1000))
    console.log('SERVICIO count:', (text.match(/SERVICIO:/gi) || []).length)
    const tours = parseOrdenText(text)
    console.log('NUMBER OF GROUPS FOUND:', tours.length)
    console.log('PARSED TOURS:', JSON.stringify(tours.map(t => ({
      service: t.service,
      operador: t.operador,
      guia: t.guia,
      totalPax: t.totalPax,
      reservations: t.reservations.length,
      firstRes: {
        hotel: t.reservations[0]?.hotel,
        client: t.reservations[0]?.clientName,
        pax: t.reservations[0]?.pax,
        rep: t.reservations[0]?.rep,
        agency: t.reservations[0]?.agency,
        time: t.reservations[0]?.pickupTime
      }
    })), null, 2))

    if (tours.length === 0) {
      return NextResponse.json({ 
        error: 'No tours found. Make sure the file has SERVICIO/OPERADOR/GUIA headers.',
        rawText: text.substring(0, 500)
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      tours,
      rawText: text.substring(0, 1000)
    })

  } catch (error: any) {
    console.error('ORDEN parse error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to parse file' 
    }, { status: 500 })
  }
}
