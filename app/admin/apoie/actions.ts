'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import {
  getStaffByDiscordId,
  staffHasPermission,
} from '@/lib/staff';

import {
  getSupportData,
  saveSupportData,
} from '@/lib/support';

import { addLog } from '@/lib/logs';

async function requireSupportPermission() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Não autenticado.');
  }

  const user = session.user as typeof session.user & {
    discordId?: string;
  };

  if (!user.discordId) {
    throw new Error('Conta do Discord inválida.');
  }

  const staff = await getStaffByDiscordId(
    user.discordId,
  );

  if (
    !staff ||
    !staffHasPermission(staff, 'support')
  ) {
    throw new Error('Sem permissão.');
  }

  return staff;
}

function revalidateSupport() {
  revalidatePath('/apoie');
  revalidatePath('/admin/apoie');
}

export async function updateSupportAction(
  formData: FormData,
) {
  await requireSupportPermission();

  const progressValue = Number(
    formData.get('progress'),
  );

  const supportUrl =
    formData
      .get('supportUrl')
      ?.toString()
      .trim() ?? '';

  const progress = Number.isFinite(progressValue)
    ? Math.min(
        100,
        Math.max(0, progressValue),
      )
    : 0;

  const data = await getSupportData();

  data.progress = progress;
  data.supportUrl = supportUrl;

  await saveSupportData(data);

  await addLog(
    'Apoie atualizado',
    `Progresso: ${progress}%`,
  );

  revalidateSupport();
}

export async function addSupporterAction(
  formData: FormData,
) {
  await requireSupportPermission();

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  if (!name) {
    return;
  }

  const data = await getSupportData();

  data.supporters.push({
    id: randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  });

  await saveSupportData(data);

  await addLog(
    'Apoiador adicionado',
    name,
  );

  revalidateSupport();
}

export async function deleteSupporterAction(
  formData: FormData,
) {
  await requireSupportPermission();

  const id =
    formData
      .get('id')
      ?.toString() ?? '';

  if (!id) {
    return;
  }

  const data = await getSupportData();

  const supporter = data.supporters.find(
    (item) => item.id === id,
  );

  data.supporters =
    data.supporters.filter(
      (item) => item.id !== id,
    );

  await saveSupportData(data);

  if (supporter) {
    await addLog(
      'Apoiador removido',
      supporter.name,
    );
  }

  revalidateSupport();
}