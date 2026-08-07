'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';

import {
  getSupportData,
  saveSupportData,
} from '@/lib/support';

function revalidateSupportPages() {
  revalidatePath('/apoie');
  revalidatePath('/admin/apoie');
}

export async function updateSupportAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('support');

  const progressValue = Number(
    formData.get('progress'),
  );

  const supportUrl =
    formData
      .get('supportUrl')
      ?.toString()
      .trim() ?? '';

  const progress = Number.isFinite(
    progressValue,
  )
    ? Math.min(
        100,
        Math.max(0, progressValue),
      )
    : 0;

  const data =
    await getSupportData();

  data.progress = progress;
  data.supportUrl = supportUrl;

  await saveSupportData(data);

  await addLog(
    'Apoie atualizado',
    `Progresso alterado para ${progress}%`,
  );

  revalidateSupportPages();
}

export async function addSupporterAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('support');

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  if (!name) {
    return;
  }

  const data =
    await getSupportData();

  data.supporters.push({
    id: randomUUID(),
    name,
    createdAt:
      new Date().toISOString(),
  });

  await saveSupportData(data);

  await addLog(
    'Apoiador adicionado',
    name,
  );

  revalidateSupportPages();
}

export async function deleteSupporterAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('support');

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  if (!id) {
    return;
  }

  const data =
    await getSupportData();

  const supporter =
    data.supporters.find(
      (item) => item.id === id,
    );

  if (!supporter) {
    return;
  }

  data.supporters =
    data.supporters.filter(
      (item) =>
        item.id !== id,
    );

  await saveSupportData(data);

  await addLog(
    'Apoiador removido',
    supporter.name,
  );

  revalidateSupportPages();
}