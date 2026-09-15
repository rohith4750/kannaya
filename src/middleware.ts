import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that do not require authentication
const PUBLIC_ROUTES = ['/login', '/logo.png', '/logo.jpg', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, next internal routes, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith('/logo.'))
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('kannaya_session');
  let isAuthenticated = false;

  if (sessionCookie && sessionCookie.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (parsed && parsed.id) {
        isAuthenticated = true;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  // If trying to access protected route without authentication, redirect strictly to /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access login page, redirect to home
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
