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
    const results: Record<string, { success: boolean; error?: string; count?: number }> = {}

    // Step 1: Clear guide_checkins (no foreign key refs)
    const { data: checkins, error: checkinsErr } = await supabaseAdmin
      .from('guide_checkins')
      .select('id')
    if (checkins?.length) {
      const { error } = await supabaseAdmin
        .from('guide_checkins')
        .delete()
        .in('id', checkins.map((c: any) => c.id))
      results['guide_checkins'] = { success: !error, error: error?.message, count: checkins.length }
      if (error) throw new Error(`guide_checkins: ${error.message}`)
    } else {
      results['guide_checkins'] = { success: true, count: 0 }
    }

    // Step 2: Clear expenses (must be before tours due to FK constraint)
    const { data: expenses, error: expensesErr } = await supabaseAdmin
      .from('expenses')
      .select('id')
    if (expenses?.length) {
      const { error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .in('id', expenses.map((e: any) => e.id))
      results['expenses'] = { success: !error, error: error?.message, count: expenses.length }
      if (error) throw new Error(`expenses: ${error.message}`)
    } else {
      results['expenses'] = { success: true, count: 0 }
    }

    // Step 3: Clear incidents (must be before tours)
    const { data: incidents, error: incidentsErr } = await supabaseAdmin
      .from('incidents')
      .select('id')
    if (incidents?.length) {
      const { error } = await supabaseAdmin
        .from('incidents')
        .delete()
        .in('id', incidents.map((i: any) => i.id))
      results['incidents'] = { success: !error, error: error?.message, count: incidents.length }
      if (error) throw new Error(`incidents: ${error.message}`)
    } else {
      results['incidents'] = { success: true, count: 0 }
    }

    // Step 4: Clear tours (after expenses and incidents are gone)
    const { data: tours, error: toursErr } = await supabaseAdmin
      .from('tours')
      .select('id')
    if (tours?.length) {
      const { error } = await supabaseAdmin
        .from('tours')
        .delete()
        .in('id', tours.map((t: any) => t.id))
      results['tours'] = { success: !error, error: error?.message, count: tours.length }
      if (error) throw new Error(`tours: ${error.message}`)
    } else {
      results['tours'] = { success: true, count: 0 }
    }

    // Step 5: Clear vehicles (last, no refs)
    const { data: vehicles, error: vehiclesErr } = await supabaseAdmin
      .from('vehicles')
      .select('id')
    if (vehicles?.length) {
      const { error } = await supabaseAdmin
        .from('vehicles')
        .delete()
        .in('id', vehicles.map((v: any) => v.id))
      results['vehicles'] = { success: !error, error: error?.message, count: vehicles.length }
      if (error) throw new Error(`vehicles: ${error.message}`)
    } else {
      results['vehicles'] = { success: true, count: 0 }
    }

    const errors = Object.entries(results)
      .filter(([, r]) => !r.success)
      .map(([table, r]) => `${table}: ${r.error}`)

    const totalCleared = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', '), results },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `Demo data cleared (${totalCleared} records). Users preserved.`,
      results
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
