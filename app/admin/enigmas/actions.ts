'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';

import {
  getRiddles,
  saveRiddles,
} from '@/lib/riddles';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

function getOptionalText(
  formData: FormData,
  field: string,
) {
  const value =
    formData.get(field)?.toString().trim() ?? '';

  return value || undefined;
}

function safeImageExtension(filename: string) {
  const extension = path
    .extname(filename)
    .toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    return null;
  }

  return extension;
}

function normalizeExternalUrl(
  value?: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  try {
    const url = new URL(normalizedValue);

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

async function saveImage(file: File) {
  const extension =
    safeImageExtension(file.name);

  if (!extension) {
    throw new Error(
      `Formato de imagem não permitido: ${file.name}`,
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
    'riddles',
  );

  await fs.mkdir(uploadDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    path.join(
      uploadDirectory,
      filename,
    ),
    bytes,
  );

  return `/uploads/riddles/${filename}`;
}

async function deleteImage(
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

function revalidateRiddlePages() {
  revalidatePath('/enigmas');
  revalidatePath('/admin/enigmas');
}

export async function addRiddleAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('riddles');

  const title =
    formData
      .get('title')
      ?.toString()
      .trim() ?? '';

  const clue =
    formData
      .get('clue')
      ?.toString()
      .trim() ?? '';

  const buttonText =
    getOptionalText(
      formData,
      'buttonText',
    );

  const rawUrl =
    getOptionalText(
      formData,
      'url',
    );

  const url =
    normalizeExternalUrl(rawUrl);

  const imageFile =
    formData.get('image') as File | null;

  if (!title) {
    return;
  }

  // Para exibir o botão,
  // nome e link precisam existir.
  const finalButtonText =
    buttonText && url
      ? buttonText
      : undefined;

  const finalUrl =
    buttonText && url
      ? url
      : undefined;

  let imagePath:
    | string
    | undefined;

  try {
    if (
      imageFile &&
      imageFile.size > 0
    ) {
      imagePath =
        await saveImage(imageFile);
    }

    const riddles =
      await getRiddles();

    riddles.push({
      id: randomUUID(),
      title,
      clue,
      image: imagePath,
      buttonText:
        finalButtonText,
      url: finalUrl,
      createdAt:
        new Date().toISOString(),
    });

    await saveRiddles(riddles);

    await addLog(
      'Enigma adicionado',
      title,
    );

    revalidateRiddlePages();
  } catch (error) {
    await deleteImage(imagePath);

    console.warn(
      'Erro ao adicionar enigma:',
      error,
    );
  }
}

export async function updateRiddleAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('riddles');

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  const title =
    formData
      .get('title')
      ?.toString()
      .trim() ?? '';

  const clue =
    formData
      .get('clue')
      ?.toString()
      .trim() ?? '';

  const buttonText =
    getOptionalText(
      formData,
      'buttonText',
    );

  const rawUrl =
    getOptionalText(
      formData,
      'url',
    );

  const url =
    normalizeExternalUrl(rawUrl);

  const imageFile =
    formData.get('image') as File | null;

  const removeImage =
    formData.get('removeImage') ===
    'on';

  if (!id || !title) {
    return;
  }

  const riddles =
    await getRiddles();

  const targetIndex =
    riddles.findIndex(
      (riddle) =>
        riddle.id === id,
    );

  if (targetIndex === -1) {
    return;
  }

  const currentRiddle =
    riddles[targetIndex];

  let nextImage =
    currentRiddle.image;

  let uploadedImage:
    | string
    | undefined;

  try {
    if (
      removeImage &&
      nextImage
    ) {
      await deleteImage(
        nextImage,
      );

      nextImage = undefined;
    }

    if (
      imageFile &&
      imageFile.size > 0
    ) {
      uploadedImage =
        await saveImage(
          imageFile,
        );

      if (nextImage) {
        await deleteImage(
          nextImage,
        );
      }

      nextImage =
        uploadedImage;
    }

    const finalButtonText =
      buttonText && url
        ? buttonText
        : undefined;

    const finalUrl =
      buttonText && url
        ? url
        : undefined;

    riddles[targetIndex] = {
      ...currentRiddle,
      title,
      clue,
      image: nextImage,
      buttonText:
        finalButtonText,
      url: finalUrl,
    };

    await saveRiddles(
      riddles,
    );

    await addLog(
      'Enigma editado',
      title,
    );

    revalidateRiddlePages();
  } catch (error) {
    if (
      uploadedImage &&
      uploadedImage !==
        currentRiddle.image
    ) {
      await deleteImage(
        uploadedImage,
      );
    }

    console.warn(
      'Erro ao editar enigma:',
      error,
    );
  }
}

export async function deleteRiddleAction(
  formData: FormData,
) {
  // Proteção real da ação
  await requireAdminAction('riddles');

  const id =
    formData
      .get('id')
      ?.toString()
      .trim() ?? '';

  if (!id) {
    return;
  }

  const riddles =
    await getRiddles();

  const target =
    riddles.find(
      (riddle) =>
        riddle.id === id,
    );

  if (!target) {
    return;
  }

  await deleteImage(
    target.image,
  );

  await saveRiddles(
    riddles.filter(
      (riddle) =>
        riddle.id !== id,
    ),
  );

  await addLog(
    'Enigma removido',
    target.title,
  );

  revalidateRiddlePages();
}