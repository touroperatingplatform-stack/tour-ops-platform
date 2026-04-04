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
  const tours: ParsedTour[] = []
  
  // Split by SERVICIO: to get all tour sections
  const sections = text.split(/(?=SERVICIO:)/i)
  
  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue
    
    // Skip header section (doesn't start with SERVICIO)
    if (!trimmed.startsWith('SERVICIO:')) continue
    
    // Parse tour header
    const tourMatch = trimmed.match(/SERVICIO:\s*(.+?)\s+OPERADOR:\s*(\S+)\s+GUIA:\s*(\S+)/i)
    if (!tourMatch) continue
    
    const tour: ParsedTour = {
      service: tourMatch[1].trim(),
      operador: tourMatch[2].trim(),
      guia: tourMatch[3].trim(),
      reservations: [],
      totalPax: 0
    }
    
    // Get lines after the header line for this tour
    const lines = trimmed.split('\n').slice(1)
    
    for (const line of lines) {
      const cleanLine = line.trim()
      if (!cleanLine) continue
      
      // Skip headers/footers
      if (cleanLine.startsWith('PLAYA DEL CARMEN') || cleanLine.startsWith('TENOCH') ||
          cleanLine.startsWith('HOTEL CLIENTE') || cleanLine.startsWith('TOTAL') ||
          cleanLine.startsWith('---') || cleanLine.startsWith('*') ||
          cleanLine.startsWith('SERVICIO:')) continue
      
      // Parse reservation line with exact pattern:
      // HOTEL CLIENT COUPON HAB PAX CONF TOUR_TYPE IN/ES TIME REP AGENCY
      // Right-to-left: Agency → Rep → Time → IN/ES → TourType → CONF → Pax → HAB → Coupon → Hotel+Client
      // Example: RIU LUPITA BEATRICE DURRANI ´055 2930 2 ´070 TCA IN 7:50 SUSANA O NS VACATIONS
      
      const resMatch = cleanLine.match(
        /^(.+?)\s+´\S+\s+(\d+)\s+(\d+)\s+´\S+\s+(TCA|CAX|AX|TU|XC)\s+(IN|ES)\s+(\d{1,2}:\d{2})\s+(.+?)\s+(NS VACATIONS|VACATIONS)$/i
      )
      
      if (resMatch) {
        const hotelClient = resMatch[1].trim()
        const paxStr = resMatch[3]
        const conf = resMatch[4]
        const pickupTime = resMatch[6]
        
        // Split hotel from client - client name is typically 2-3 words
        // Hotel names are usually all caps or known resort names
        const hotelMatch = hotelClient.match(/^(.+?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/)
        
        let hotel = hotelClient
        let clientName = ''
        if (hotelMatch) {
          hotel = hotelMatch[1].trim()
          clientName = hotelMatch[2].trim()
        }
        
        const paxData = parsePax(paxStr)
        tour.reservations.push({
          hotel,
          clientName,
          coupon: '', // Coupon is the first ´ prefixed word in original line
          pax: paxStr,
          adults: paxData.adults,
          children: paxData.children,
          infants: paxData.infants,
          confirmation: conf,
          pickupTime,
          agency: resMatch[8]
        })
        tour.totalPax += paxData.adults + paxData.children + paxData.infants
      }
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
    console.log('FIRST ROW RAW:', text.split('\n').find(l => l.includes('RIU') || l.includes('PRINCESS') || l.includes('HM')))
    const tours = parseOrdenText(text)
    console.log('NUMBER OF GROUPS FOUND:', tours.length)
    console.log('PARSED TOURS:', JSON.stringify(tours.map(t => ({ 
      service: t.service, 
      operador: t.operador, 
      guia: t.guia, 
      totalPax: t.totalPax,
      reservations: t.reservations.length,
      sampleReservation: t.reservations[0]
    })), null, 2))

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
