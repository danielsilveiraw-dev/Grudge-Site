import { getSupabaseServer } from '@/lib/supabase-server';

export const SITE_PAGES = [
  '/',
  '/alfabeto',
  '/calendario',
  '/enigmas',
] as const;

export type SitePage =
  (typeof SITE_PAGES)[number];

export type Song = {
  id: string;
  name: string;
  audio: string;
  cover?: string;
  pages: SitePage[];
  createdAt: string;
};

type MusicRow = {
  id: string;
  name: string;
  audio: string;
  cover: string | null;
  pages: unknown;
  created_at: string;
};

function normalizePages(
  value: unknown,
): SitePage[] {
  if (!Array.isArray(value)) {
    return ['/'];
  }

  const validPages =
    value.filter(
      (
        page,
      ): page is SitePage =>
        typeof page === 'string' &&
        SITE_PAGES.includes(
          page as SitePage,
        ),
    );

  return validPages.length > 0
    ? validPages
    : ['/'];
}

export async function getSongs(): Promise<
  Song[]
> {
  const supabase =
    getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('music')
    .select(
      `
        id,
        name,
        audio,
        cover,
        pages,
        created_at
      `,
    )
    .order(
      'created_at',
      {
        ascending: true,
      },
    );

  if (error) {
    console.error(
      'Erro ao buscar músicas:',
      error,
    );

    return [];
  }

  return ((data ?? []) as MusicRow[])
    .map((song) => ({
      id:
        String(
          song.id ?? '',
        ),

      name:
        String(
          song.name ?? '',
        ),

      audio:
        String(
          song.audio ?? '',
        ),

      cover:
        typeof song.cover === 'string' &&
        song.cover
          ? song.cover
          : undefined,

      pages:
        normalizePages(
          song.pages,
        ),

      createdAt:
        typeof song.created_at === 'string'
          ? song.created_at
          : new Date().toISOString(),
    }))
    .filter(
      (song) =>
        song.id &&
        song.name &&
        song.audio,
    );
}

export async function saveSongs(
  songs: Song[],
): Promise<void> {
  const supabase =
    getSupabaseServer();

  const {
    data: existingRows,
    error: readError,
  } = await supabase
    .from('music')
    .select('id');

  if (readError) {
    console.error(
      'Erro ao verificar músicas existentes:',
      readError,
    );

    throw readError;
  }

  const existingIds =
    new Set(
      (existingRows ?? []).map(
        (row) =>
          String(
            row.id,
          ),
      ),
    );

  const nextIds =
    new Set(
      songs.map(
        (song) =>
          song.id,
      ),
    );

  const idsToDelete = [
    ...existingIds,
  ].filter(
    (id) =>
      !nextIds.has(id),
  );

  if (
    idsToDelete.length > 0
  ) {
    const {
      error: deleteError,
    } = await supabase
      .from('music')
      .delete()
      .in(
        'id',
        idsToDelete,
      );

    if (deleteError) {
      console.error(
        'Erro ao remover músicas:',
        deleteError,
      );

      throw deleteError;
    }
  }

  if (
    songs.length === 0
  ) {
    return;
  }

  const rows =
    songs.map(
      (song) => ({
        id:
          song.id,

        name:
          song.name,

        audio:
          song.audio,

        cover:
          song.cover ??
          null,

        pages:
          normalizePages(
            song.pages,
          ),

        created_at:
          song.createdAt,
      }),
    );

  const {
    error: upsertError,
  } = await supabase
    .from('music')
    .upsert(
      rows,
      {
        onConflict:
          'id',
      },
    );

  if (upsertError) {
    console.error(
      'Erro ao salvar músicas:',
      upsertError,
    );

    throw upsertError;
  }
}