'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';

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
  const index =
    filename.lastIndexOf('.');

  if (index === -1) {
    return null;
  }

  const extension =
    filename
      .slice(index)
      .toLowerCase();

  if (!allowed.has(extension)) {
    return null;
  }

  return extension;
}

function getSelectedPages(
  formData: FormData,
): SitePage[] {
  const selectedPages =
    formData
      .getAll('pages')
      .map((value) =>
        value.toString(),
      )
      .filter(
        (
          page,
        ): page is SitePage =>
          SITE_PAGES.includes(
            page as SitePage,
          ),
      );

  return [
    ...new Set(
      selectedPages,
    ),
  ];
}

async function saveUpload(
  file: File,
  bucket: 'music-audio' | 'music-covers',
  allowedExtensions: Set<string>,
) {
  const extension =
    safeExtension(
      file.name,
      allowedExtensions,
    );

  if (!extension) {
    throw new Error(
      `Formato de arquivo não permitido: ${file.name}`,
    );
  }

  const filename =
    `${randomUUID()}${extension}`;

  const bytes =
    Buffer.from(
      await file.arrayBuffer(),
    );

  const supabase =
    getSupabaseServer();

  const {
    error: uploadError,
  } = await supabase
    .storage
    .from(bucket)
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
      `Erro ao enviar arquivo para ${bucket}:`,
      uploadError,
    );

    throw uploadError;
  }

  const {
    data: publicUrlData,
  } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(
      filename,
    );

  return publicUrlData.publicUrl;
}

async function deleteStorageFile(
  publicUrl:
    | string
    | undefined,
  bucket:
    | 'music-audio'
    | 'music-covers',
) {
  if (!publicUrl) {
    return;
  }

  /*
   * Ignora arquivos antigos que ainda
   * estejam como /uploads/music/...
   */
  if (
    !publicUrl.startsWith(
      'http://',
    ) &&
    !publicUrl.startsWith(
      'https://',
    )
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
    .from(bucket)
    .remove([
      filename,
    ]);

  if (error) {
    console.error(
      `Erro ao remover arquivo de ${bucket}:`,
      error,
    );
  }
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
  await requireAdminAction(
    'music',
  );

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  const audioValue =
    formData.get('audio');

  const coverValue =
    formData.get('cover');

  const pages =
    getSelectedPages(
      formData,
    );

  if (
    !name ||
    !(audioValue instanceof File) ||
    audioValue.size === 0
  ) {
    return;
  }

  if (
    pages.length === 0
  ) {
    return;
  }

  let audioPath:
    | string
    | undefined;

  let coverPath:
    | string
    | undefined;

  try {
    audioPath =
      await saveUpload(
        audioValue,
        'music-audio',
        AUDIO_EXTENSIONS,
      );

    if (
      coverValue instanceof File &&
      coverValue.size > 0
    ) {
      coverPath =
        await saveUpload(
          coverValue,
          'music-covers',
          IMAGE_EXTENSIONS,
        );
    }

    const songs =
      await getSongs();

    songs.push({
      id: randomUUID(),
      name,
      audio:
        audioPath,
      cover:
        coverPath,
      pages,
      createdAt:
        new Date()
          .toISOString(),
    });

    await saveSongs(
      songs,
    );

    await addLog(
      'Música adicionada',
      name,
    );

    revalidateMusicPages();
  } catch (error) {
    await Promise.all([
      deleteStorageFile(
        audioPath,
        'music-audio',
      ),

      deleteStorageFile(
        coverPath,
        'music-covers',
      ),
    ]);

    console.error(
      'Erro ao adicionar música:',
      error,
    );
  }
}

export async function updateSongPagesAction(
  formData: FormData,
) {
  await requireAdminAction(
    'music',
  );

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  const pages =
    getSelectedPages(
      formData,
    );

  if (!id) {
    console.warn(
      'Não foi possível editar: ID da música ausente.',
    );

    return;
  }

  if (
    pages.length === 0
  ) {
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

  if (
    targetIndex === -1
  ) {
    console.warn(
      'Música não encontrada:',
      id,
    );

    return;
  }

  songs[targetIndex] = {
    ...songs[
      targetIndex
    ],
    pages,
  };

  await saveSongs(
    songs,
  );

  await addLog(
    'Páginas da música alteradas',
    songs[targetIndex].name,
  );

  revalidateMusicPages();

  redirect(
    '/admin/musicas',
  );
}

export async function deleteSongAction(
  formData: FormData,
) {
  await requireAdminAction(
    'music',
  );

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

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
    deleteStorageFile(
      target.audio,
      'music-audio',
    ),

    deleteStorageFile(
      target.cover,
      'music-covers',
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