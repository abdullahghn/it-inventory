import { NextRequest, NextResponse } from 'next/server'
import { auth } from './lib/auth'

// Define route protection rules
const routeProtection = {
  // Public routes (no authentication required)
  public: [
    '/',
    '/auth/signin',
    '/auth/signout',
    '/auth/error',
    '/api/auth',
  ],
  
  // Protected routes - require authentication only
  protected: [
    '/dashboard',
  ],
}

function isPublicRoute(pathname: string): boolean {
  return routeProtection.public.some(route => {
    if (route === pathname) return true
    if (route.endsWith('/') && pathname.startsWith(route)) return true
    if (pathname.startsWith('/api/auth/')) return true
    return false
  })
}

function isProtectedRoute(pathname: string): boolean {
  return routeProtection.protected.some(route => {
    return pathname === route || pathname.startsWith(route + '/')
  })
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    // Check if user is authenticated
    if (!req.auth?.user) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }
  
  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
})

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 