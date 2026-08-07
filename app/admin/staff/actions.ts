'use server';

import { revalidatePath } from 'next/cache';

import {
  getStaffMembers,
  saveStaffMembers,
  STAFF_PERMISSIONS,
  type NormalStaffPermission,
  type StaffPermission,
} from '@/lib/staff';

import { addLog } from '@/lib/logs';
import { requireMasterAction } from '@/lib/admin-access';

function getSelectedPermissions(
  formData: FormData,
): StaffPermission[] {
  const totalAccess =
    formData.get('all') === 'on';

  if (totalAccess) {
    return ['all'];
  }

  const selected = formData
    .getAll('permissions')
    .map((value) => value.toString())
    .filter(
      (
        permission,
      ): permission is NormalStaffPermission =>
        STAFF_PERMISSIONS.includes(
          permission as NormalStaffPermission,
        ),
    );

  return [...new Set(selected)];
}

export async function addStaffAction(
  formData: FormData,
) {
  const currentUser =
    await requireMasterAction();

  const newDiscordId =
    formData
      .get('discordId')
      ?.toString()
      .trim() ?? '';

  const role =
    formData
      .get('role')
      ?.toString()
      .trim() ?? '';

  const permissions =
    getSelectedPermissions(formData);

  if (
    !newDiscordId ||
    !role ||
    permissions.length === 0
  ) {
    return;
  }

  if (!/^\d+$/.test(newDiscordId)) {
    return;
  }

  const staffs =
    await getStaffMembers();

  const alreadyExists =
    staffs.some(
      (staff) =>
        staff.discordId === newDiscordId,
    );

  if (alreadyExists) {
    return;
  }

  staffs.push({
    discordId: newDiscordId,
    role,
    permissions,
    createdAt: new Date().toISOString(),

    addedBy:
      currentUser.name ??
      'Staff',

    addedByDiscordId:
      currentUser.discordId,
  });

  await saveStaffMembers(staffs);

  await addLog(
    'Staff adicionado',
    `${newDiscordId} • ${role}`,
  );

  revalidatePath('/admin/staff');
}

export async function updateStaffAction(
  formData: FormData,
) {
  const currentUser =
    await requireMasterAction();

  const currentDiscordId =
    currentUser.discordId ?? '';

  const discordId =
    formData
      .get('discordId')
      ?.toString()
      .trim() ?? '';

  const role =
    formData
      .get('role')
      ?.toString()
      .trim() ?? '';

  const permissions =
    getSelectedPermissions(formData);

  if (
    !discordId ||
    !role ||
    permissions.length === 0
  ) {
    return;
  }

  const staffs =
    await getStaffMembers();

  const target =
    staffs.find(
      (staff) =>
        staff.discordId === discordId,
    );

  if (!target) {
    return;
  }

  // Não permite remover seu próprio acesso master.
  if (
    discordId === currentDiscordId &&
    !permissions.includes('all')
  ) {
    return;
  }

  target.role = role;
  target.permissions = permissions;

  await saveStaffMembers(staffs);

  await addLog(
    'Staff editado',
    `${target.name ?? discordId} • ${role}`,
  );

  revalidatePath('/admin/staff');
}

export async function deleteStaffAction(
  formData: FormData,
) {
  const currentUser =
    await requireMasterAction();

  const currentDiscordId =
    currentUser.discordId ?? '';

  const discordId =
    formData
      .get('discordId')
      ?.toString()
      .trim() ?? '';

  if (!discordId) {
    return;
  }

  // Você não pode remover a si mesmo.
  if (
    discordId === currentDiscordId
  ) {
    return;
  }

  const staffs =
    await getStaffMembers();

  const target =
    staffs.find(
      (staff) =>
        staff.discordId === discordId,
    );

  if (!target) {
    return;
  }

  await saveStaffMembers(
    staffs.filter(
      (staff) =>
        staff.discordId !== discordId,
    ),
  );

  await addLog(
    'Staff removido',
    target.name ??
      target.discordId,
  );

  revalidatePath('/admin/staff');
}