import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Not logged in - redirect to login
    if (request.nextUrl.pathname.startsWith('/guide') || 
        request.nextUrl.pathname.startsWith('/supervisor')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return res
  }
  
  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  const role = profile?.role
  const path = request.nextUrl.pathname
  
  // Guide routes - only guides and above
  if (path.startsWith('/guide')) {
    if (!['guide', 'supervisor', 'manager', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  // Supervisor routes - only supervisors and above
  if (path.startsWith('/supervisor')) {
    if (!['supervisor', 'manager', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  // Manager routes - only managers and admin
  if (path.startsWith('/manager')) {
    if (!['manager', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  // Admin routes - only admin
  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/guide/:path*',
    '/supervisor/:path*',
    '/manager/:path*',
    '/admin/:path*',
  ]
}
