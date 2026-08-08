'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import {
  getEvents,
  saveEvents,
} from '@/lib/events';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';

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

  const file =
    formData.get('image') as File | null;

  if (!title || !date) {
    return;
  }

  let imagePath: string | undefined;

  if (
    file &&
    file.size > 0 &&
    file.name
  ) {
    const bytes = Buffer.from(
      await file.arrayBuffer(),
    );

    const extension =
      path.extname(file.name).toLowerCase() ||
      '.jpg';

    const filename =
      `${randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      'public',
      'uploads',
      'events',
    );

    await fs.mkdir(
      uploadDirectory,
      {
        recursive: true,
      },
    );

    await fs.writeFile(
      path.join(
        uploadDirectory,
        filename,
      ),
      bytes,
    );

    imagePath =
      `/uploads/events/${filename}`;
  }

  const events = await getEvents();

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

  revalidatePath('/');
  revalidatePath('/calendario');
  revalidatePath('/admin/calendario');
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

  const events = await getEvents();

  const target =
    events.find(
      (event) =>
        event.id === id,
    );

  if (!target) {
    return;
  }

  if (target.image) {
    const normalizedPath =
      target.image.replace(
        /^\/+/,
        '',
      );

    const filePath = path.join(
      process.cwd(),
      'public',
      normalizedPath,
    );

    await fs
      .unlink(filePath)
      .catch(() => {});
  }

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

  revalidatePath('/');
  revalidatePath('/calendario');
  revalidatePath('/admin/calendario');
}