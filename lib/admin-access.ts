import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import type { StaffPermission } from '@/lib/staff';

export type AdminPermission =
  Exclude<StaffPermission, 'all'>;

type AdminSessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;

  discordId?: string;
  permissions?: string[];
  role?: string;
};

export async function getAdminUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user =
    session.user as AdminSessionUser;

  const permissions =
    Array.isArray(user.permissions)
      ? user.permissions
      : [];

  return {
    ...user,
    permissions,
  };
}

export function hasAdminPermission(
  permissions: string[],
  permission: AdminPermission,
) {
  return (
    permissions.includes('all') ||
    permissions.includes(permission)
  );
}

/**
 * Para páginas administrativas.
 *
 * - sem login -> /admin/login
 * - sem permissão -> /admin/sem-acesso
 */
export async function requireAdminPage(
  permission: AdminPermission,
) {
  const user = await getAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (
    !hasAdminPermission(
      user.permissions,
      permission,
    )
  ) {
    redirect('/admin/sem-acesso');
  }

  return user;
}

/**
 * Para Server Actions.
 *
 * Nunca dependa apenas do cadeado visual do menu.
 * A própria ação também verifica a permissão.
 */
export async function requireAdminAction(
  permission: AdminPermission,
) {
  const user = await getAdminUser();

  if (!user) {
    throw new Error(
      'Você precisa estar autenticado.',
    );
  }

  if (
    !hasAdminPermission(
      user.permissions,
      permission,
    )
  ) {
    throw new Error(
      'Você não possui permissão para realizar esta ação.',
    );
  }

  return user;
}

/**
 * Apenas usuários master.
 */
export async function requireMasterPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (!user.permissions.includes('all')) {
    redirect('/admin/sem-acesso');
  }

  return user;
}

export async function requireMasterAction() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error(
      'Você precisa estar autenticado.',
    );
  }

  if (!user.permissions.includes('all')) {
    throw new Error(
      'Somente usuários com acesso total podem realizar esta ação.',
    );
  }

  return user;
}