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
    // Delete data in reverse order (respecting foreign keys)
    const tables = [
      'guide_checkins',
      'expenses', 
      'incidents',
      'tours',
      'vehicles'
    ]

    let deleted = 0
    const errors: string[] = []

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (error) {
        errors.push(`${table}: ${error.message}`)
      } else {
        deleted++
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', '), deleted },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      deleted,
      message: 'Demo data cleared. Users preserved.'
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
