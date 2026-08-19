import {
  NextResponse,
} from 'next/server';

import {
  auth,
} from '@/auth';

export default auth(
  async (request) => {
    const pathname =
      request.nextUrl.pathname;

    /*
     * A página de login precisa
     * continuar pública.
     */
    if (
      pathname ===
      '/admin/login'
    ) {
      return NextResponse.next();
    }

    const session =
      request.auth;

    /*
     * Não está autenticado.
     */
    if (
      !session?.user
    ) {
      const loginUrl =
        new URL(
          '/admin/login',
          request.url,
        );

      return NextResponse.redirect(
        loginUrl,
      );
    }

    const user =
      session.user as typeof session.user & {
        isStaff?: boolean;
      };

    /*
     * Está autenticado no Discord,
     * mas NÃO é staff.
     *
     * Importante:
     * login da transmissão NÃO
     * dá acesso ao admin.
     */
    if (
      user.isStaff !==
      true
    ) {
      const loginUrl =
        new URL(
          '/admin/login',
          request.url,
        );

      loginUrl.searchParams.set(
        'error',
        'AccessDenied',
      );

      return NextResponse.redirect(
        loginUrl,
      );
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};