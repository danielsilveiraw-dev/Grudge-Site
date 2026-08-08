'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStreamers } from '@/lib/streamers';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function safeExtension(filename: string) {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) return null;
  return extension;
}

async function saveImage(file: File) {
  const extension = safeExtension(file.name);
  if (!extension) throw new Error('Formato de imagem inválido.');

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}${extension}`;

  const { error } = await getSupabaseServer()
    .storage.from('streamers')
    .upload(filename, bytes, { contentType: file.type });

  if (error) throw error;

  const { data } = getSupabaseServer().storage.from('streamers').getPublicUrl(filename);
  return data.publicUrl;
}

async function deleteImage(publicUrl?: string) {
  if (!publicUrl) return;
  const filename = publicUrl.split('/').pop();
  if (!filename) return;
  await getSupabaseServer().storage.from('streamers').remove([filename]);
}

function revalidateStreamerPages() {
  revalidatePath('/streamers');
  revalidatePath('/admin/streamers');
}

export async function addStreamerAction(formData: FormData) {
  await requireAdminAction('streamers');

  const name = formData.get('name')?.toString().trim() ?? '';
  const image = formData.get('image') as File | null;

  if (!name || !image || image.size === 0) return;

  let imagePath: string | undefined;

  try {
    imagePath = await saveImage(image);

    const { error } = await getSupabaseServer().from('streamers').insert({
      name,
      image: imagePath,
      instagram: formData.get('instagram')?.toString().trim() ?? '',
      discord: formData.get('discord')?.toString().trim() ?? '',
      youtube: formData.get('youtube')?.toString().trim() ?? '',
      twitch: formData.get('twitch')?.toString().trim() ?? '',
      kick: formData.get('kick')?.toString().trim() ?? '',
      tiktok: formData.get('tiktok')?.toString().trim() ?? '',
      x: formData.get('x')?.toString().trim() ?? '',
    });

    if (error) throw error;

    await addLog('Streamer adicionado', name);
    revalidateStreamerPages();
  } catch (error) {
    if (imagePath) await deleteImage(imagePath);
    console.warn('Erro ao adicionar streamer:', error);
  }
}

export async function deleteStreamerAction(formData: FormData) {
  await requireAdminAction('streamers');

  const id = formData.get('id')?.toString().trim() ?? '';
  if (!id) return;

  const streamers = await getStreamers();
  const target = streamers.find((s) => s.id === id);
  if (!target) return;

  await deleteImage(target.image);
  await getSupabaseServer().from('streamers').delete().eq('id', id);

  await addLog('Streamer removido', target.name);
  revalidateStreamerPages();
}