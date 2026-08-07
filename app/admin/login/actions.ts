'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { addLog } from '@/lib/logs';

const COOKIE_NAME = 'admin_session';

export async function loginAction(formData: FormData) {
  const user = formData.get('user')?.toString() ?? '';
  const password = formData.get('password')?.toString() ?? '';

  const validUser = process.env.ADMIN_USER || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (user === validUser && password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, 'ok', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
    await addLog('Login realizado', user);
    redirect('/admin/calendario');
  }

  await addLog('Tentativa de login falhou', user || '(vazio)');
  redirect('/admin/login?erro=1');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  await addLog('Logout realizado');
  redirect('/admin/login');
}
