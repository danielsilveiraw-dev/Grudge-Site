'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';

import {
  getSongs,
  saveSongs,
  SITE_PAGES,
  type SitePage,
} from '@/lib/music';

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.aac',
  '.flac',
]);

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

function safeExtension(
  filename: string,
  allowed: Set<string>,
) {
  const extension = path
    .extname(filename)
    .toLowerCase();

  if (!allowed.has(extension)) {
    return null;
  }

  return extension;
}

function getSelectedPages(
  formData: FormData,
): SitePage[] {
  const selectedPages = formData
    .getAll('pages')
    .map((value) => value.toString())
    .filter((page): page is SitePage =>
      SITE_PAGES.includes(page as SitePage),
    );

  return [...new Set(selectedPages)];
}

async function saveUpload(
  file: File,
  folder: string,
  allowedExtensions: Set<string>,
) {
  const extension = safeExtension(
    file.name,
    allowedExtensions,
  );

  if (!extension) {
    throw new Error(
      `Formato de arquivo não permitido: ${file.name}`,
    );
  }

  const bytes = Buffer.from(
    await file.arrayBuffer(),
  );

  const filename =
    `${randomUUID()}${extension}`;

  const uploadDirectory = path.join(
    process.cwd(),
    'public',
    'uploads',
    'music',
    folder,
  );

  await fs.mkdir(uploadDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    path.join(uploadDirectory, filename),
    bytes,
  );

  return `/uploads/music/${folder}/${filename}`;
}

async function deletePublicFile(
  publicPath?: string,
) {
  if (!publicPath) {
    return;
  }

  const normalizedPath =
    publicPath.replace(/^\/+/, '');

  const filePath = path.join(
    process.cwd(),
    'public',
    normalizedPath,
  );

  await fs
    .unlink(filePath)
    .catch(() => {});
}

function revalidateMusicPages() {
  revalidatePath('/');
  revalidatePath('/alfabeto');
  revalidatePath('/calendario');
  revalidatePath('/enigmas');
  revalidatePath('/admin/musicas');
}

export async function addSongAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('music');

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  const audioFile =
    formData.get('audio') as File | null;

  const coverFile =
    formData.get('cover') as File | null;

  const pages =
    getSelectedPages(formData);

  if (
    !name ||
    !audioFile ||
    audioFile.size === 0
  ) {
    return;
  }

  if (pages.length === 0) {
    return;
  }

  let audioPath:
    | string
    | undefined;

  let coverPath:
    | string
    | undefined;

  try {
    audioPath = await saveUpload(
      audioFile,
      'audio',
      AUDIO_EXTENSIONS,
    );

    if (
      coverFile &&
      coverFile.size > 0
    ) {
      coverPath = await saveUpload(
        coverFile,
        'covers',
        IMAGE_EXTENSIONS,
      );
    }

    const songs =
      await getSongs();

    songs.push({
      id: randomUUID(),
      name,
      audio: audioPath,
      cover: coverPath,
      pages,
      createdAt:
        new Date().toISOString(),
    });

    await saveSongs(songs);

    await addLog(
      'Música adicionada',
      name,
    );

    revalidateMusicPages();
  } catch (error) {
    await deletePublicFile(
      audioPath,
    );

    await deletePublicFile(
      coverPath,
    );

    console.warn(
      'Erro ao adicionar música:',
      error,
    );
  }
}

export async function updateSongPagesAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('music');

  const id =
    formData
      .get('id')
      ?.toString() ?? '';

  const pages =
    getSelectedPages(formData);

  if (!id) {
    console.warn(
      'Não foi possível editar: ID da música ausente.',
    );

    return;
  }

  if (pages.length === 0) {
    console.warn(
      'Selecione pelo menos uma página para a música.',
    );

    return;
  }

  const songs =
    await getSongs();

  const targetIndex =
    songs.findIndex(
      (song) =>
        song.id === id,
    );

  if (targetIndex === -1) {
    console.warn(
      'Música não encontrada:',
      id,
    );

    return;
  }

  songs[targetIndex] = {
    ...songs[targetIndex],
    pages,
  };

  await saveSongs(songs);

  await addLog(
    'Páginas da música alteradas',
    songs[targetIndex].name,
  );

  revalidateMusicPages();

  redirect('/admin/musicas');
}

export async function deleteSongAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('music');

  const id =
    formData
      .get('id')
      ?.toString();

  if (!id) {
    return;
  }

  const songs =
    await getSongs();

  const target =
    songs.find(
      (song) =>
        song.id === id,
    );

  if (!target) {
    return;
  }

  await Promise.all([
    deletePublicFile(
      target.audio,
    ),
    deletePublicFile(
      target.cover,
    ),
  ]);

  await saveSongs(
    songs.filter(
      (song) =>
        song.id !== id,
    ),
  );

  await addLog(
    'Música removida',
    target.name,
  );

  revalidateMusicPages();
}