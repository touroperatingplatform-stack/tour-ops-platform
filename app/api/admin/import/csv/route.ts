import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// POST /api/admin/import/csv
// Import bookings from CSV file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const partnerId = formData.get('partner_id') as string
    const companyId = formData.get('company_id') as string

    if (!file || !companyId) {
      return NextResponse.json({ error: 'Missing file or company ID' }, { status: 400 })
    }

    // Read CSV content
    const csvText = await file.text()
    const rows = parseCSV(csvText)

    const results = {
      total: rows.length,
      created: 0,
      errors: [] as string[]
    }

    // Process each row
    for (const row of rows) {
      try {
        const result = await importBooking(row, companyId, partnerId)
        if (result.success) {
          results.created++
        } else {
          results.errors.push(result.error || 'Unknown error')
        }
      } catch (err: any) {
        results.errors.push(err.message)
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.created,
      total: results.total,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

async function importBooking(row: any, companyId: string, partnerId: string | null) {
  // Map common CSV column names
  const booking = {
    reference: row.reference || row.booking_ref || row.confirmation || row.id || row['booking reference'],
    tour_name: row.tour || row.tour_name || row.product || row['tour name'] || row.activity,
    tour_date: parseDate(row.date || row.tour_date || row['travel date'] || row['tour date']),
    start_time: row.time || row.start_time || row['start time'] || row.pickup_time || '09:00',
    first_name: row.first_name || row.firstname || row['first name'] || row.guest_first_name || row.customer_first_name,
    last_name: row.last_name || row.lastname || row['last name'] || row.guest_last_name || row.customer_last_name,
    email: row.email || row['e-mail'] || row.customer_email,
    phone: row.phone || row.telephone || row.mobile || row['phone number'],
    hotel: row.hotel || row.hotel_name || row['hotel name'] || row.pickup || row['pickup location'],
    room_number: row.room || row.room_number || row['room number'] || row['room #'],
    adults: parseInt(row.adults || row.adult || row['adult count'] || row.pax) || 1,
    children: parseInt(row.children || row.child || row['child count'] || row.kids) || 0,
    commission: parseFloat(row.commission || row['commission amount'] || row.fee) || 0
  }

  if (!booking.tour_name || !booking.tour_date) {
    return { success: false, error: `Missing tour name or date for ${booking.reference || 'unknown'}` }
  }

  // Find or create tour
  const { data: existingTour } = await supabase
    .from('tours')
    .select('id')
    .eq('company_id', companyId)
    .eq('tour_date', booking.tour_date)
    .ilike('name', `%${booking.tour_name}%`)
    .single()

  let tourId = existingTour?.id

  if (!tourId) {
    const { data: newTour, error } = await supabase
      .from('tours')
      .insert({
        company_id: companyId,
        name: booking.tour_name,
        tour_date: booking.tour_date,
        start_time: booking.start_time,
        status: 'scheduled',
        guest_count: booking.adults + booking.children
      })
      .select('id')
      .single()
    
    if (error) {
      return { success: false, error: `Failed to create tour: ${error.message}` }
    }
    tourId = newTour?.id
  }

  // Create guest
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      tour_id: tourId,
      first_name: booking.first_name || 'Unknown',
      last_name: booking.last_name || 'Guest',
      email: booking.email,
      phone: booking.phone,
      hotel: booking.hotel,
      room_number: booking.room_number,
      adults: booking.adults,
      children: booking.children,
      booking_reference: booking.reference
    })
    .select('id')
    .single()

  if (guestError) {
    return { success: false, error: `Failed to create guest: ${guestError.message}` }
  }

  // Create external booking if partner provided
  if (partnerId) {
    await supabase
      .from('external_bookings')
      .insert({
        tour_id: tourId,
        guest_id: guest?.id,
        partner_id: partnerId,
        external_booking_id: booking.reference || `import-${Date.now()}`,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        commission_amount: booking.commission
      })
  }

  // Update tour guest count
  if (tourId) {
    await supabase.rpc('update_tour_guest_count', { tour_id: tourId })
  }

  return { success: true }
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  // Try different formats
  const formats = [
    // 2024-03-30
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // 30/03/2024 or 30-03-2024
    /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/,
    // 03/30/2024 (US)
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // Mar 30, 2024
    /^(\w{3})\s+(\d{1,2}),?\s+(\d{4})$/i
  ]

  for (const regex of formats) {
    const match = dateStr.match(regex)
    if (match) {
      if (regex === formats[0]) {
        return `${match[1]}-${match[2]}-${match[3]}`
      } else if (regex === formats[1]) {
        return `${match[3]}-${match[2]}-${match[1]}`
      } else if (regex === formats[2]) {
        return `${match[3]}-${match[1]}-${match[2]}`
      }
    }
  }

  // Fallback: try native Date parsing
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}
