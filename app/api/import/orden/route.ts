import { NextRequest, NextResponse } from 'next/server'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

// Disable worker - we're in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Parse PAX format ──────────────────────────────────────────────────────
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

    // Data line
    const parts = line.split(/\s+/)
    if (parts.length >= 6 && currentTour.service) {
      const paxData = parsePax(parts[3] || '1')
      
      const reservation: ParsedReservation = {
        hotel: parts[0],
        clientName: parts[1] + (parts[2] ? ' ' + parts[2] : ''),
        coupon: parts[2] || '',
        pax: parts[3] || '1',
        adults: paxData.adults,
        children: paxData.children,
        infants: paxData.infants,
        confirmation: parts[4] || '',
        pickupTime: parts[5] || '09:00',
        agency: parts[parts.length - 1] || ''
      }

      currentTour.reservations = currentTour.reservations || []
      currentTour.reservations.push(reservation)
      currentTour.totalPax = (currentTour.totalPax || 0) + paxData.adults + paxData.children + paxData.infants
    }
  }

  if (currentTour.service) {
    tours.push(currentTour as ParsedTour)
  }

  return tours
}

// ─── Extract text from PDF ──────────────────────────────────────────────────
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer)
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
  const pdf = await loadingTask.promise
  
  let fullText = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }
  
  return fullText
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
      // Parse PDF server-side
      const buffer = await file.arrayBuffer()
      text = await extractTextFromPDF(buffer)

      if (!text || text.length < 50) {
        return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 })
      }
    } else {
      // Plain text file
      text = await file.text()
    }

    // Parse ORDEN format
    const tours = parseOrdenText(text)

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
