'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';

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
    formData
      .get(field)
      ?.toString()
      .trim() ?? '';

  return value || undefined;
}

function safeImageExtension(
  filename: string,
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

  if (
    !IMAGE_EXTENSIONS.has(
      extension,
    )
  ) {
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

  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  try {
    const url =
      new URL(
        normalizedValue,
      );

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

async function saveImage(
  file: File,
) {
  const extension =
    safeImageExtension(
      file.name,
    );

  if (!extension) {
    throw new Error(
      `Formato de imagem não permitido: ${file.name}`,
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
    .from('riddles')
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
      'Erro ao enviar imagem do enigma:',
      uploadError,
    );

    throw uploadError;
  }

  const {
    data: publicUrlData,
  } = supabase
    .storage
    .from('riddles')
    .getPublicUrl(
      filename,
    );

  return publicUrlData.publicUrl;
}

async function deleteImage(
  publicUrl?: string,
) {
  if (!publicUrl) {
    return;
  }

  // Ignora imagens antigas locais,
  // como /uploads/riddles/arquivo.png
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
    .from('riddles')
    .remove([
      filename,
    ]);

  if (error) {
    console.error(
      'Erro ao remover imagem do enigma:',
      error,
    );
  }
}

function revalidateRiddlePages() {
  revalidatePath('/');
  revalidatePath('/enigmas');
  revalidatePath(
    '/admin/enigmas',
  );
}

export async function addRiddleAction(
  formData: FormData,
) {
  await requireAdminAction(
    'riddles',
  );

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
    normalizeExternalUrl(
      rawUrl,
    );

  const imageValue =
    formData.get(
      'image',
    );

  if (!title) {
    return;
  }

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
      imageValue instanceof File &&
      imageValue.size > 0
    ) {
      imagePath =
        await saveImage(
          imageValue,
        );
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
        new Date()
          .toISOString(),
    });

    await saveRiddles(
      riddles,
    );

    await addLog(
      'Enigma adicionado',
      title,
    );

    revalidateRiddlePages();
  } catch (error) {
    if (imagePath) {
      await deleteImage(
        imagePath,
      );
    }

    console.error(
      'Erro ao adicionar enigma:',
      error,
    );
  }
}

export async function updateRiddleAction(
  formData: FormData,
) {
  await requireAdminAction(
    'riddles',
  );

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
    normalizeExternalUrl(
      rawUrl,
    );

  const imageValue =
    formData.get(
      'image',
    );

  const removeImage =
    formData.get(
      'removeImage',
    ) === 'on';

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

  if (
    targetIndex === -1
  ) {
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

      nextImage =
        undefined;
    }

    if (
      imageValue instanceof File &&
      imageValue.size > 0
    ) {
      uploadedImage =
        await saveImage(
          imageValue,
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
      image:
        nextImage,
      buttonText:
        finalButtonText,
      url:
        finalUrl,
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

    console.error(
      'Erro ao editar enigma:',
      error,
    );
  }
}

export async function deleteRiddleAction(
  formData: FormData,
) {
  await requireAdminAction(
    'riddles',
  );

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