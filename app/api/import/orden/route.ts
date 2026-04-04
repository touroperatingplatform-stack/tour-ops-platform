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
function parsePax(paxStr: string): { adults: number; children: number; infants: number } {
  const parts = paxStr.split('.')
  const adults = parseInt(parts[0]) || 1
  const children = parseInt(parts[1]) || 0
  const infants = parseInt(parts[2]) || 0
  return { adults, children, infants }
}

// ─── Parse ORDEN text ──────────────────────────────────────────────────────
function parseOrdenText(text: string): ParsedTour[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const tours: ParsedTour[] = []
  let currentTour: Partial<ParsedTour> = {}

  for (const line of lines) {
    // Skip headers
    if (line.startsWith('PLAYA DEL CARMEN') || line.startsWith('TENOCH') ||
        line.startsWith('HOTEL CLIENTE') || line.startsWith('TOTAL') ||
        line.startsWith('---') || line.startsWith('*')) continue

    // Tour header: SERVICIO: TULUM CENOTE AKUMAL OPERADOR: FEDERICO GUIA: JUAN
    const tourMatch = line.match(/SERVICIO:\s*(.+?)\s+OPERADOR:\s*(\S+)\s+GUIA:\s*(\S+)/i)
    if (tourMatch) {
      if (currentTour.service) {
        tours.push(currentTour as ParsedTour)
      }
      currentTour = {
        service: tourMatch[1].trim(),
        operador: tourMatch[2].trim(),
        guia: tourMatch[3].trim(),
        reservations: [],
        totalPax: 0
      }
      continue
    }

    // Skip if no current tour
    if (!currentTour.service) continue

    // Parse reservation line RIGHT-TO-LEFT using anchor values
    const words = line.split(/\s+/)
    
    // Find time (H:MM or HH:MM) - scan for time pattern anywhere in line
    const timeMatch = line.match(/\b(\d{1,2}:\d{2})\b/)
    const pickupTime = timeMatch ? timeMatch[1] : '09:00'
    
    // Agency - last 1-2 words (could be multi-word like "CANCUN DISCOUNT")
    // We need to find where rep ends and agency begins
    // Rep is typically 1 word, agency might be 1-2 words
    // Working right-to-left: time → pax → rep → agency → coupon → confirmation → hotel+client
    
    // Find pax (single digit number) - it's right before time
    // But time might be at end, so pax is before that
    let paxStr = '1'
    let paxIdx = -1
    const timeIdx = words.findIndex(w => /\d{1,2}:\d{2}/.test(w))
    if (timeIdx > 0) {
      // Pax should be immediately before time
      const maybePax = words[timeIdx - 1]
      if (/^\d{1,2}$/.test(maybePax)) {
        paxStr = maybePax
        paxIdx = timeIdx - 1
      }
    }
    
    // Coupon starts with special char like ´ or similar
    let couponIdx = -1
    for (let i = 0; i < words.length; i++) {
      if (words[i].startsWith('´') || words[i].startsWith("'") || /´/.test(words[i])) {
        couponIdx = i
        break
      }
    }
    
    // If no special char, try to find a word before confirmation that's not a number
    // Confirmation is typically a 5-6 digit number
    let confirmation = ''
    let confIdx = -1
    for (let i = Math.max(paxIdx, 0); i < words.length; i++) {
      if (/^\d{5,}$/.test(words[i])) {
        confirmation = words[i]
        confIdx = i
        break
      }
    }
    
    // Hotel + client = everything before coupon (or before conf if no coupon)
    let hotel = ''
    let clientName = ''
    let coupon = ''
    
    const splitIdx = couponIdx > 0 ? couponIdx : (confIdx > 0 ? confIdx : words.length)
    
    // Handle the prefix part (hotel + client)
    const prefix = words.slice(0, splitIdx).join(' ')
    
    // Known hotel patterns (all caps, or specific resort names)
    // Try to split hotel from client at the first capitalized name
    const hotelPatterns = [
      /^(.+?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/,
      /^(.+?)\s+([A-Z][a-z]+)$/
    ]
    
    for (const pattern of hotelPatterns) {
      const match = prefix.match(pattern)
      if (match) {
        hotel = match[1].trim()
        clientName = match[2].trim()
        break
      }
    }
    
    if (!hotel) {
      hotel = prefix
      clientName = ''
    }
    
    // Rep is typically 1-2 words before time
    let rep = ''
    if (timeIdx > paxIdx + 1) {
      rep = words.slice(paxIdx + 1, timeIdx).join(' ')
    }
    
    // Agency is the remaining words after rep and before coupon/conf
    let agency = ''
    if (confIdx > timeIdx + 1) {
      agency = words.slice(timeIdx + 1, confIdx).join(' ')
    } else if (couponIdx > timeIdx + 1) {
      agency = words.slice(timeIdx + 1, couponIdx).join(' ')
    }
    
    // Build reservation
    const paxData = parsePax(paxStr)
    const reservation: ParsedReservation = {
      hotel,
      clientName,
      coupon: couponIdx >= 0 ? words[couponIdx] : '',
      pax: paxStr,
      adults: paxData.adults,
      children: paxData.children,
      infants: paxData.infants,
      confirmation,
      pickupTime,
      agency
    }

    currentTour.reservations = currentTour.reservations || []
    currentTour.reservations.push(reservation)
    currentTour.totalPax = (currentTour.totalPax || 0) + paxData.adults + paxData.children + paxData.infants
  }

  if (currentTour.service) {
    tours.push(currentTour as ParsedTour)
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

    // Handle both PDF and text files
    let text: string

    if (file.name.toLowerCase().endsWith('.pdf')) {
      // Parse PDF server-side with unpdf
      const buffer = await file.arrayBuffer()
      const { text: extractedText } = await extractText(new Uint8Array(buffer))
      text = Array.isArray(extractedText) ? extractedText.join('\n') : extractedText

      if (!text || text.length < 50) {
        return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 })
      }
    } else {
      // Plain text file
      text = await file.text()
    }

    // Parse ORDEN format
    console.log('RAW TEXT:', text.substring(0, 500))
    const tours = parseOrdenText(text)
    console.log('PARSED TOURS:', JSON.stringify(tours.map(t => ({ service: t.service, operador: t.operador, guia: t.guia, totalPax: t.totalPax, sampleReservation: t.reservations[0] })), null, 2))

    if (tours.length === 0) {
      return NextResponse.json({ 
        error: 'No tours found in file. Make sure the file has SERVICIO/OPERADOR/GUIA headers.',
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
