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

// Temporary debug log for PAX
let paxLogCount = 0

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
    const headerMatch = lines[0].match(/^(.+?)\s+OPERADOR:\s*(\S+)\s+GUIA:\s*(\S+)/i)
    if (!headerMatch) continue
    
    const tour: ParsedTour = {
      service: headerMatch[1].trim(),
      operador: headerMatch[2].trim(),
      guia: headerMatch[3].trim(),
      reservations: [],
      totalPax: 0
    }
    
    // DEBUG: log raw pax token for first reservation of each group
    const firstResLine = lines.slice(1).find(l => reservationLine.test(l) && !l.includes('HOTEL') && !l.includes('TOTAL') && !l.includes('---'))
    if (firstResLine) {
      const firstTokens = firstResLine.trim().split(/\s+/)
      const firstCouponIdx = firstTokens.findIndex(t => t.startsWith('´') || /^\d{4,}$/.test(t))
      const secondCouponIdx = firstTokens.findIndex((t, i) => i > firstCouponIdx && (t.startsWith('´') || /^\d{4,}$/.test(t)))
      const firstPax = secondCouponIdx > firstCouponIdx + 1 ? firstTokens[secondCouponIdx - 1] : 'NOT_FOUND'
      console.log('Group', groupIdx, 'first reservation pax raw token:', firstPax)
    }
    groupIdx++
    
    // Step 3: Find reservation lines (have time and aren't header/footer)
    const reservationLine = /^\s*\S+.*\d+:\d+.*$/
    
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
      
      // Pax is a standalone 1-2 digit number between HAB (3-4 digits) and confirmation (´ prefixed)
      // Find pax by looking for a small number between HAB and second coupon
      let paxStr = '1'
      if (secondCouponIdx > firstCouponIdx + 1) {
        const potentialPax = tokens[secondCouponIdx - 1]
        // Pax is 1-2 digits, HAB is 3-4 digits
        if (/^\d{1,2}$/.test(potentialPax) && potentialPax.length <= 2) {
          paxStr = potentialPax
        }
      }
      
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
      
      // Rep is between time and agency (1-2 words)
      const repTokens: string[] = []
      for (let i = timeIdx + 1; i < tokens.length; i++) {
        if (tokens[i].match(/^(NS\s)?VACACIONES?|CHARTERS?|VAC[A-Z]*$/i)) break
        repTokens.push(tokens[i])
      }
      const rep = repTokens.join(' ')
      
      // Agency is the last words
      const agencyTokens = tokens.slice(timeIdx + 1 + repTokens.length)
      const agency = agencyTokens.join(' ')
      
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
      reservations: t.reservations.length
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
