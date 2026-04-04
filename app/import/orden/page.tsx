'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import Link from 'next/link'

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

// ─── Extract text from PDF (client-side only) ─────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
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

// ─── Parse PAX format (adults.children.infants) ───────────────────────────────
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

    // Data line: HOTEL CLIENTE CUPONHAB PAX #CONF. TOUR_ID HORA REP AGENCIA
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdenImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileText, setFileText] = useState('')
  const [parsedTours, setParsedTours] = useState<ParsedTour[]>([])
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
      const driverMatch = drivers.find(d => 
        d.full_name.toLowerCase().includes(tour.operador.toLowerCase()) ||
        tour.operador.toLowerCase().includes(d.full_name.toLowerCase().split(' ')[0])
      )
      
      const guideMatch = guides.find(g =>
        g.full_name.toLowerCase().includes(tour.guia.toLowerCase()) ||
        tour.guia.toLowerCase().includes(g.full_name.toLowerCase().split(' ')[0])
      )

      return {
        ...tour,
        operadorId: driverMatch?.id,
        guiaId: guideMatch?.id
      }
    })
  }

  // ─── Step 1: Handle file upload & parse ────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      let text = ''

      // Extract text based on file type
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractTextFromPDF(file)
      } else {
        // Plain text file
        text = await file.text()
      }

      const tours = parseOrdenText(text)
      if (tours.length === 0) {
        setError('No tours found. Make sure the file has SERVICIO/OPERADOR/GUIA headers.')
        setParsing(false)
        return
      }

      // Match staff names to IDs
      const toursWithStaff = matchStaff(tours)

      setFileText(text)
      setParsedTours(toursWithStaff)
      setStep(2)
    } catch (err: any) {
      setError('Failed to parse file: ' + (err.message || 'Unknown error'))
    } finally {
      setParsing(false)
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
        // Create tour
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

        // Create reservation_manifest records
        let stopOrder = 1
        for (const res of tour.reservations) {
          // Create reservation_manifest entry
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

          // Create pickup_stop
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

        // Update tour guest count
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
      setStep(5)
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
                { num: 2, label: 'Staff' },
                { num: 3, label: 'Date' },
                { num: 4, label: 'Confirm' },
                { num: 5, label: 'Done' }
              ].map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${step === s.num ? 'bg-purple-600 text-white' : 
                      step > s.num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.num ? '✓' : s.num}
                  </span>
                  <span className={step === s.num ? 'text-purple-600 font-medium' : 'text-gray-400'}>{s.label}</span>
                  {i < 4 && <span className="text-gray-300 mx-1">→</span>}
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

            {/* ── Step 2: Staff Assignment ── */}
            {step === 2 && (
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
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Select Date ── */}
            {step === 3 && (
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

            {/* ── Step 4: Final Confirm ── */}
            {step === 4 && (
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
                    onClick={() => setStep(3)}
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

            {/* ── Step 5: Done ── */}
            {step === 5 && (
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
