import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import crypto from 'crypto'

// POST /api/webhooks/bookings
// Receives bookings from Viator, GetYourGuide, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-webhook-signature')
    const partnerId = request.headers.get('x-partner-id')

    if (!partnerId) {
      return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 })
    }

    // Verify webhook signature (if configured)
    const { data: partner } = await supabase
      .from('booking_partners')
      .select('id, company_id, webhook_secret, auto_confirm')
      .eq('id', partnerId)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Invalid partner' }, { status: 401 })
    }

    // Verify signature if secret exists
    if (partner.webhook_secret && signature) {
      const expectedSig = crypto
        .createHmac('sha256', partner.webhook_secret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Process booking based on partner type
    const result = await processBooking(body, partner)

    return NextResponse.json({ 
      success: true, 
      booking_id: result.bookingId,
      tour_id: result.tourId,
      guest_id: result.guestId
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function processBooking(data: any, partner: any) {
  // Normalize booking data based on partner
  const booking = normalizeBookingData(data, partner)

  // Find or create tour
  const { data: tour } = await supabase
    .from('tours')
    .select('id')
    .eq('company_id', partner.company_id)
    .eq('tour_date', booking.tour_date)
    .ilike('name', `%${booking.tour_name}%`)
    .single()

  let tourId = tour?.id

  // Create tour if doesn't exist
  if (!tourId) {
    const { data: newTour } = await supabase
      .from('tours')
      .insert({
        company_id: partner.company_id,
        name: booking.tour_name,
        tour_date: booking.tour_date,
        start_time: booking.start_time || '09:00',
        status: 'scheduled',
        guest_count: booking.pax
      })
      .select('id')
      .single()
    
    tourId = newTour?.id
  }

  // Create guest
  const { data: guest } = await supabase
    .from('guests')
    .insert({
      tour_id: tourId,
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone: booking.phone,
      hotel: booking.hotel,
      room_number: booking.room_number,
      adults: booking.adults || 1,
      children: booking.children || 0,
      booking_reference: booking.reference
    })
    .select('id')
    .single()

  // Create external booking record
  const { data: externalBooking } = await supabase
    .from('external_bookings')
    .insert({
      tour_id: tourId,
      guest_id: guest?.id,
      partner_id: partner.id,
      external_booking_id: booking.reference,
      external_voucher: booking.voucher,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
      commission_amount: booking.commission
    })
    .select('id')
    .single()

  // Auto-update tour guest count
  if (tourId) {
    await supabase.rpc('update_tour_guest_count', { tour_id: tourId })
  }

  return {
    bookingId: externalBooking?.id,
    tourId,
    guestId: guest?.id
  }
}

function normalizeBookingData(data: any, partner: any) {
  // Handle different partner formats
  
  // Viator format
  if (data.bookingReference || data.productCode) {
    return {
      reference: data.bookingReference || data.confirmationNumber,
      voucher: data.voucherNumber,
      tour_name: data.productName || data.tourName,
      tour_date: data.travelDate,
      start_time: data.pickupTime || data.startTime,
      first_name: data.leadPassenger?.firstName || data.customer?.firstName,
      last_name: data.leadPassenger?.lastName || data.customer?.lastName,
      email: data.leadPassenger?.email || data.customer?.email,
      phone: data.leadPassenger?.phone || data.customer?.phone,
      hotel: data.pickupLocation?.name || data.hotelName,
      room_number: data.roomNumber,
      adults: parseInt(data.adults) || 1,
      children: parseInt(data.children) || 0,
      pax: parseInt(data.totalPassengers) || 1,
      commission: parseFloat(data.commissionAmount) || 0
    }
  }

  // GetYourGuide format
  if (data.booking_id || data.tour_id) {
    return {
      reference: data.booking_id || data.reservation_code,
      voucher: data.voucher_code,
      tour_name: data.tour_name || data.product_title,
      tour_date: data.date,
      start_time: data.start_time,
      first_name: data.customer_first_name || data.first_name,
      last_name: data.customer_last_name || data.last_name,
      email: data.customer_email || data.email,
      phone: data.customer_phone || data.phone,
      hotel: data.hotel_name || data.pickup_location,
      room_number: data.room_number,
      adults: parseInt(data.adult_count) || 1,
      children: parseInt(data.child_count) || 0,
      pax: parseInt(data.total travelers) || 1,
      commission: parseFloat(data.commission) || 0
    }
  }

  // Generic format
  return {
    reference: data.reference || data.id,
    voucher: data.voucher,
    tour_name: data.tour_name || data.product_name,
    tour_date: data.date || data.tour_date,
    start_time: data.time || data.start_time,
    first_name: data.first_name || data.guest_first_name,
    last_name: data.last_name || data.guest_last_name,
    email: data.email,
    phone: data.phone || data.telephone,
    hotel: data.hotel || data.hotel_name,
    room_number: data.room || data.room_number,
    adults: parseInt(data.adults) || 1,
    children: parseInt(data.children) || 0,
    pax: parseInt(data.pax) || parseInt(data.passengers) || 1,
    commission: parseFloat(data.commission) || 0
  }
}
