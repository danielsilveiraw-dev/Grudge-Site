import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user);

  const isLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin');

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL('/admin/calendario', request.url),
      );
    }

    return NextResponse.next();
  }

  if (isAdminPage && !isLoggedIn) {
    return NextResponse.redirect(
      new URL('/admin/login', request.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],

  // Necessário porque auth.ts importa lib/staff.ts,
  // que usa fs e path.
  runtime: 'nodejs',
};