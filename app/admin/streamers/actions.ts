'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';

import {
  getStreamers,
  saveStreamers,
} from '@/lib/streamers';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

function safeExtension(filename: string) {
  const extension = path
    .extname(filename)
    .toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    return null;
  }

  return extension;
}

async function saveImage(file: File) {
  const extension = safeExtension(file.name);

  if (!extension) {
    throw new Error(
      'Formato de imagem inválido.',
    );
  }

  const bytes = Buffer.from(
    await file.arrayBuffer(),
  );

  const filename =
    `${randomUUID()}${extension}`;

  const directory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'streamers',
  );

  await fs.mkdir(directory, {
    recursive: true,
  });

  await fs.writeFile(
    path.join(directory, filename),
    bytes,
  );

  return `/uploads/streamers/${filename}`;
}

async function deleteImage(
  publicPath?: string,
) {
  if (!publicPath) {
    return;
  }

  const file = path.join(
    process.cwd(),
    'public',
    publicPath.replace(/^\/+/, ''),
  );

  await fs
    .unlink(file)
    .catch(() => {});
}

function revalidateStreamerPages() {
  revalidatePath('/streamers');
  revalidatePath('/admin/streamers');
}

export async function addStreamerAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('streamers');

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  const image =
    formData.get('image') as File | null;

  if (
    !name ||
    !image ||
    image.size === 0
  ) {
    return;
  }

  let imagePath:
    | string
    | undefined;

  try {
    imagePath = await saveImage(image);

    const streamers =
      await getStreamers();

    streamers.push({
      id: randomUUID(),
      name,
      image: imagePath,

      instagram:
        formData
          .get('instagram')
          ?.toString()
          .trim() ?? '',

      discord:
        formData
          .get('discord')
          ?.toString()
          .trim() ?? '',

      youtube:
        formData
          .get('youtube')
          ?.toString()
          .trim() ?? '',

      twitch:
        formData
          .get('twitch')
          ?.toString()
          .trim() ?? '',

      kick:
        formData
          .get('kick')
          ?.toString()
          .trim() ?? '',

      tiktok:
        formData
          .get('tiktok')
          ?.toString()
          .trim() ?? '',

      x:
        formData
          .get('x')
          ?.toString()
          .trim() ?? '',

      createdAt:
        new Date().toISOString(),
    });

    await saveStreamers(streamers);

    await addLog(
      'Streamer adicionado',
      name,
    );

    revalidateStreamerPages();
  } catch (error) {
    if (imagePath) {
      await deleteImage(imagePath);
    }

    console.warn(
      'Erro ao adicionar streamer:',
      error,
    );
  }
}

export async function deleteStreamerAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('streamers');

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  if (!id) {
    return;
  }

  const streamers =
    await getStreamers();

  const target =
    streamers.find(
      (streamer) =>
        streamer.id === id,
    );

  if (!target) {
    return;
  }

  await deleteImage(
    target.image,
  );

  await saveStreamers(
    streamers.filter(
      (streamer) =>
        streamer.id !== id,
    ),
  );

  await addLog(
    'Streamer removido',
    target.name,
  );

  revalidateStreamerPages();
}