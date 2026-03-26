import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tours, incidents, expenses, vehicles, guide_checkins } = body

    let imported = 0
    const errors: string[] = []

    // Import tours
    if (tours?.length > 0) {
      for (const tour of tours) {
        const { error } = await supabaseAdmin
          .from('tours')
          .upsert(tour, { onConflict: 'id' })
        if (error) errors.push(`Tour: ${error.message}`)
        else imported++
      }
    }

    // Import incidents
    if (incidents?.length > 0) {
      for (const incident of incidents) {
        const { error } = await supabaseAdmin
          .from('incidents')
          .upsert(incident, { onConflict: 'id' })
        if (error) errors.push(`Incident: ${error.message}`)
        else imported++
      }
    }

    // Import expenses
    if (expenses?.length > 0) {
      for (const expense of expenses) {
        const { error } = await supabaseAdmin
          .from('expenses')
          .upsert(expense, { onConflict: 'id' })
        if (error) errors.push(`Expense: ${error.message}`)
        else imported++
      }
    }

    // Import vehicles
    if (vehicles?.length > 0) {
      for (const vehicle of vehicles) {
        const { error } = await supabaseAdmin
          .from('vehicles')
          .upsert(vehicle, { onConflict: 'id' })
        if (error) errors.push(`Vehicle: ${error.message}`)
        else imported++
      }
    }

    // Import guide_checkins (bypasses RLS with service role)
    if (guide_checkins?.length > 0) {
      for (const checkin of guide_checkins) {
        const { error } = await supabaseAdmin
          .from('guide_checkins')
          .upsert(checkin, { onConflict: 'id' })
        if (error) errors.push(`Checkin: ${error.message}`)
        else imported++
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported, 
      errors: errors.length > 0 ? errors : null 
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
