import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import {
  getStaffByDiscordId,
  type StaffPermission,
} from '@/lib/staff';

export type AdminPermission =
  Exclude<StaffPermission, 'all'>;

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  discordId?: string;
};

export async function getAdminUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user =
    session.user as SessionUser;

  const discordId =
    user.discordId ?? '';

  if (!discordId) {
    return null;
  }

  const staff =
    await getStaffByDiscordId(discordId);

  if (!staff) {
    return null;
  }

  return {
    name:
      user.name ??
      staff.name ??
      'Staff',

    email:
      user.email ?? null,

    image:
      user.image ??
      staff.image ??
      null,

    discordId,

    role:
      staff.role,

    permissions:
      staff.permissions,
  };
}

export function hasAdminPermission(
  permissions: StaffPermission[],
  permission: AdminPermission,
) {
  return (
    permissions.includes('all') ||
    permissions.includes(permission)
  );
}

/**
 * Proteção para páginas administrativas.
 */
export async function requireAdminPage(
  permission: AdminPermission,
) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const user =
    await getAdminUser();

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
 * Proteção para Server Actions.
 *
 * Consulta o staff.json novamente em cada ação,
 * garantindo que as permissões estejam atualizadas.
 */
export async function requireAdminAction(
  permission: AdminPermission,
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      'Você precisa estar autenticado.',
    );
  }

  const user =
    await getAdminUser();

  if (!user) {
    throw new Error(
      'Sua conta não possui acesso ao painel.',
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
 * Somente usuários com "all".
 */
export async function requireMasterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const user =
    await getAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (
    !user.permissions.includes('all')
  ) {
    redirect('/admin/sem-acesso');
  }

  return user;
}

/**
 * Proteção das ações de gerenciamento de Staff.
 */
export async function requireMasterAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      'Você precisa estar autenticado.',
    );
  }

  const user =
    await getAdminUser();

  if (!user) {
    throw new Error(
      'Sua conta não possui acesso ao painel.',
    );
  }

  if (
    !user.permissions.includes('all')
  ) {
    throw new Error(
      'Somente usuários com acesso total podem realizar esta ação.',
    );
  }

  return user;
}