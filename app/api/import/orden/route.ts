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
      
      // Parse reservation line RIGHT-TO-LEFT using anchor values
      const words = cleanLine.split(/\s+/)
      
      // Find time (H:MM or HH:MM) - scan for time pattern anywhere in line
      const timeMatch = cleanLine.match(/\b(\d{1,2}:\d{2})\b/)
      const pickupTime = timeMatch ? timeMatch[1] : '09:00'
      
      // Find pax (single digit number) - right before time
      let paxStr = '1'
      let paxIdx = -1
      const timeIdx = words.findIndex(w => /\d{1,2}:\d{2}/.test(w))
      if (timeIdx > 0) {
        const maybePax = words[timeIdx - 1]
        if (/^\d{1,2}$/.test(maybePax)) {
          paxStr = maybePax
          paxIdx = timeIdx - 1
        }
      }
      
      // Coupon starts with special char like ´
      let couponIdx = -1
      for (let i = 0; i < words.length; i++) {
        if (words[i].startsWith('´') || words[i].startsWith("'")) {
          couponIdx = i
          break
        }
      }
      
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
      
      // Hotel + client = everything before coupon (or before conf)
      let hotel = ''
      let clientName = ''
      const splitIdx = couponIdx > 0 ? couponIdx : (confIdx > 0 ? confIdx : words.length)
      const prefix = words.slice(0, splitIdx).join(' ')
      
      // Split hotel from client at the first capitalized name
      const match = prefix.match(/^(.+?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/)
      if (match) {
        hotel = match[1].trim()
        clientName = match[2].trim()
      } else {
        hotel = prefix
        clientName = ''
      }
      
      // Rep is between pax and time
      let rep = ''
      if (timeIdx > paxIdx + 1) {
        rep = words.slice(paxIdx + 1, timeIdx).join(' ')
      }
      
      // Agency is between time and coupon/conf
      let agency = ''
      if (confIdx > timeIdx + 1) {
        agency = words.slice(timeIdx + 1, confIdx).join(' ')
      } else if (couponIdx > timeIdx + 1) {
        agency = words.slice(timeIdx + 1, couponIdx).join(' ')
      }
      
      const paxData = parsePax(paxStr)
      tour.reservations.push({
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
    const tours = parseOrdenText(text)
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
