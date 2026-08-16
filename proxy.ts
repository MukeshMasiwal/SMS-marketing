import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/contacts',
  '/groups',
  '/campaigns',
  '/messages',
  '/analytics',
  '/packages',
  '/settings',
  '/profile',
  '/account',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isProtected) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = await verifyToken(token)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin') && (session.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/contacts/:path*',
    '/groups/:path*',
    '/campaigns/:path*',
    '/messages/:path*',
    '/analytics/:path*',
    '/packages/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/account/:path*',
  ],
}
