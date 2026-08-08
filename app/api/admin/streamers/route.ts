import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { addLog } from '@/lib/logs';
import { requireAdminAction } from '@/lib/admin-access';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    await requireAdminAction('streamers');

    const formData =
      await request.formData();

    const name =
      formData
        .get('name')
        ?.toString()
        .trim() ?? '';

    const imageValue =
      formData.get('image');

    if (
      !name ||
      !(imageValue instanceof File) ||
      imageValue.size === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Nome e imagem são obrigatórios.',
        },
        {
          status: 400,
        },
      );
    }

    const extension =
      getExtension(imageValue.name);

    if (!extension) {
      return NextResponse.json(
        {
          error:
            'Formato de imagem inválido.',
        },
        {
          status: 400,
        },
      );
    }

    const filename =
      `${randomUUID()}${extension}`;

    const bytes =
      Buffer.from(
        await imageValue.arrayBuffer(),
      );

    const supabase =
      getSupabaseServer();

    const {
      error: uploadError,
    } = await supabase
      .storage
      .from('streamers')
      .upload(
        filename,
        bytes,
        {
          contentType:
            imageValue.type ||
            'application/octet-stream',
          upsert: false,
        },
      );

    if (uploadError) {
      console.error(
        'Erro no Storage:',
        uploadError,
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar a imagem.',
        },
        {
          status: 500,
        },
      );
    }

    const {
      data: publicUrlData,
    } = supabase
      .storage
      .from('streamers')
      .getPublicUrl(filename);

    const image =
      publicUrlData.publicUrl;

    const instagram =
      formData
        .get('instagram')
        ?.toString()
        .trim() ?? '';

    const youtube =
      formData
        .get('youtube')
        ?.toString()
        .trim() ?? '';

    const twitch =
      formData
        .get('twitch')
        ?.toString()
        .trim() ?? '';

    const kick =
      formData
        .get('kick')
        ?.toString()
        .trim() ?? '';

    const tiktok =
      formData
        .get('tiktok')
        ?.toString()
        .trim() ?? '';

    const x =
      formData
        .get('x')
        ?.toString()
        .trim() ?? '';

    const {
      error: insertError,
    } = await supabase
      .from('streamers')
      .insert({
        name,
        image,
        instagram,
        youtube,
        twitch,
        kick,
        tiktok,
        x,
      });

    if (insertError) {
      console.error(
        'Erro ao inserir streamer:',
        insertError,
      );

      await supabase
        .storage
        .from('streamers')
        .remove([filename]);

      return NextResponse.json(
        {
          error:
            'Não foi possível salvar o streamer.',
        },
        {
          status: 500,
        },
      );
    }

    await addLog(
      'Streamer adicionado',
      name,
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Erro na API de streamers:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Não foi possível adicionar o streamer.',
      },
      {
        status: 500,
      },
    );
  }
}