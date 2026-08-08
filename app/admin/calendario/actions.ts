'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import {
  getEvents,
  saveEvents,
} from '@/lib/events';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

function getExtension(filename: string) {
  const index = filename.lastIndexOf('.');

  if (index === -1) {
    return null;
  }

  const extension = filename
    .slice(index)
    .toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    return null;
  }

  return extension;
}

async function saveImage(
  file: File,
): Promise<string> {
  const extension =
    getExtension(file.name);

  if (!extension) {
    throw new Error(
      'Formato de imagem inválido.',
    );
  }

  const filename =
    `${randomUUID()}${extension}`;

  const bytes = Buffer.from(
    await file.arrayBuffer(),
  );

  const supabase =
    getSupabaseServer();

  const {
    error: uploadError,
  } = await supabase
    .storage
    .from('events')
    .upload(
      filename,
      bytes,
      {
        contentType:
          file.type ||
          'application/octet-stream',
        upsert: false,
      },
    );

  if (uploadError) {
    console.error(
      'Erro ao enviar imagem do evento:',
      uploadError,
    );

    throw uploadError;
  }

  const {
    data: publicUrlData,
  } = supabase
    .storage
    .from('events')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

async function deleteImage(
  publicUrl?: string,
) {
  if (!publicUrl) {
    return;
  }

  // Não tenta apagar imagens antigas locais.
  if (
    !publicUrl.startsWith('http://') &&
    !publicUrl.startsWith('https://')
  ) {
    return;
  }

  const filename =
    publicUrl
      .split('?')[0]
      .split('/')
      .pop();

  if (!filename) {
    return;
  }

  const supabase =
    getSupabaseServer();

  const {
    error,
  } = await supabase
    .storage
    .from('events')
    .remove([filename]);

  if (error) {
    console.error(
      'Erro ao remover imagem do evento:',
      error,
    );
  }
}

function revalidateEventPages() {
  revalidatePath('/');
  revalidatePath('/calendario');
  revalidatePath('/admin/calendario');
}

export async function addEventAction(
  formData: FormData,
) {
  await requireAdminAction('calendar');

  const title =
    formData
      .get('title')
      ?.toString()
      .trim() ?? '';

  const date =
    formData
      .get('date')
      ?.toString()
      .trim() ?? '';

  const description =
    formData
      .get('description')
      ?.toString()
      .trim() ?? '';

  const imageValue =
    formData.get('image');

  if (!title || !date) {
    return;
  }

  let imagePath:
    | string
    | undefined;

  try {
    if (
      imageValue instanceof File &&
      imageValue.size > 0
    ) {
      imagePath =
        await saveImage(
          imageValue,
        );
    }

    const events =
      await getEvents();

    events.push({
      id: randomUUID(),
      title,
      date,
      description:
        description || undefined,
      image: imagePath,
    });

    await saveEvents(events);

    await addLog(
      'Evento adicionado',
      title,
    );

    revalidateEventPages();
  } catch (error) {
    console.error(
      'Erro ao adicionar evento:',
      error,
    );

    if (imagePath) {
      await deleteImage(
        imagePath,
      );
    }
  }
}

export async function deleteEventAction(
  formData: FormData,
) {
  await requireAdminAction('calendar');

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  if (!id) {
    return;
  }

  const events =
    await getEvents();

  const target =
    events.find(
      (event) =>
        event.id === id,
    );

  if (!target) {
    return;
  }

  await deleteImage(
    target.image,
  );

  await saveEvents(
    events.filter(
      (event) =>
        event.id !== id,
    ),
  );

  await addLog(
    'Evento removido',
    target.title,
  );

  revalidateEventPages();
}