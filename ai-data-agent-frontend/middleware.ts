import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');
  
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Allow access to auth pages and API auth routes
  if (isAuthPage || isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api/query/:path*',
    '/api/users/:path*',
    '/api/change-password/:path*',
    // Exclude public routes
    '/((?!api/auth|login|forgot-password|reset-password|_next/static|_next/image|favicon.ico).*)',
  ],
};
