import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Skip middleware for public routes
  if (path === '/login' || path === '/' || path.startsWith('/_next')) {
    return NextResponse.next()
  }
  
  // Simple cookie check - look for Supabase auth token
  const hasAuth = request.cookies.has('sb-access-token') || request.cookies.has('sb-refresh-token')
  
  if (!hasAuth && (path.startsWith('/guide') || path.startsWith('/supervisor'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/guide/:path*',
    '/supervisor/:path*',
    '/manager/:path*',
    '/admin/:path*',
  ]
}
