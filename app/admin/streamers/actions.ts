'use server';

import { revalidatePath } from 'next/cache';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStreamers } from '@/lib/streamers';

async function deleteImage(publicUrl?: string) {
  if (!publicUrl) {
    return;
  }

  const filename = publicUrl
    .split('/')
    .pop();

  if (!filename) {
    return;
  }

  const supabase =
    getSupabaseServer();

  await supabase
    .storage
    .from('streamers')
    .remove([filename]);
}

function revalidateStreamerPages() {
  revalidatePath('/streamers');
  revalidatePath('/admin/streamers');
}

export async function deleteStreamerAction(
  formData: FormData,
) {
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

  const supabase =
    getSupabaseServer();

  await deleteImage(
    target.image,
  );

  const {
    error,
  } = await supabase
    .from('streamers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(
      'Erro ao remover streamer:',
      error,
    );

    return;
  }

  await addLog(
    'Streamer removido',
    target.name,
  );

  revalidateStreamerPages();
}