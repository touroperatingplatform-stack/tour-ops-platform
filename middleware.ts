import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if accessing protected routes
  const path = request.nextUrl.pathname
  
  // For now, just check if user has a session cookie
  // In production, you'd validate the JWT token here
  const hasSession = request.cookies.has('sb-access-token')
  
  if (!hasSession) {
    // Not logged in - redirect to login
    if (path.startsWith('/guide') || path.startsWith('/supervisor')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Role-based checks would require server-side token validation
  // For now, we rely on client-side role checks in the pages
  
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
