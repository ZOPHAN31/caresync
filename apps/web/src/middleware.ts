import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Redirect authenticated users away from auth pages
    const { pathname } = req.nextUrl;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const token = req.nextauth.token;

    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        // Public routes — no auth required
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/invite',
        ];
        const isPublic = publicRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        );
        if (isPublic) return true;
        // All other routes require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};
