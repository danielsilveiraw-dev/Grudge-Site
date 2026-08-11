import { getSupabaseServer } from '@/lib/supabase-server';

export type Riddle = {
  id: string;
  title: string;
  clue: string;
  image?: string;
  buttonText?: string;
  url?: string;
  createdAt: string;
};

type RiddleRow = {
  id: string;
  title: string;
  clue: string | null;
  image: string | null;
  button_text: string | null;
  url: string | null;
  created_at: string;
};

export async function getRiddles(): Promise<Riddle[]> {
  const supabase =
    getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('riddles')
    .select(
      `
        id,
        title,
        clue,
        image,
        button_text,
        url,
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
      'Erro ao buscar enigmas:',
      error,
    );

    return [];
  }

  return ((data ?? []) as RiddleRow[])
    .map((riddle) => ({
      id:
        String(
          riddle.id ?? '',
        ),

      title:
        String(
          riddle.title ?? '',
        ),

      clue:
        typeof riddle.clue === 'string'
          ? riddle.clue
          : '',

      image:
        typeof riddle.image === 'string' &&
        riddle.image
          ? riddle.image
          : undefined,

      buttonText:
        typeof riddle.button_text === 'string' &&
        riddle.button_text.trim()
          ? riddle.button_text
          : undefined,

      url:
        typeof riddle.url === 'string' &&
        riddle.url.trim()
          ? riddle.url
          : undefined,

      createdAt:
        typeof riddle.created_at === 'string'
          ? riddle.created_at
          : new Date().toISOString(),
    }))
    .filter(
      (riddle) =>
        riddle.id &&
        riddle.title,
    );
}

export async function saveRiddles(
  riddles: Riddle[],
): Promise<void> {
  const supabase =
    getSupabaseServer();

  const {
    data: existingRows,
    error: readError,
  } = await supabase
    .from('riddles')
    .select('id');

  if (readError) {
    console.error(
      'Erro ao verificar enigmas existentes:',
      readError,
    );

    throw readError;
  }

  const existingIds = new Set(
    (existingRows ?? []).map(
      (row) =>
        String(
          row.id,
        ),
    ),
  );

  const nextIds = new Set(
    riddles.map(
      (riddle) =>
        riddle.id,
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
      .from('riddles')
      .delete()
      .in(
        'id',
        idsToDelete,
      );

    if (deleteError) {
      console.error(
        'Erro ao remover enigmas:',
        deleteError,
      );

      throw deleteError;
    }
  }

  if (
    riddles.length === 0
  ) {
    return;
  }

  const rows =
    riddles.map(
      (riddle) => ({
        id:
          riddle.id,

        title:
          riddle.title,

        clue:
          riddle.clue ?? '',

        image:
          riddle.image ??
          null,

        button_text:
          riddle.buttonText ??
          null,

        url:
          riddle.url ??
          null,

        created_at:
          riddle.createdAt,
      }),
    );

  const {
    error: upsertError,
  } = await supabase
    .from('riddles')
    .upsert(
      rows,
      {
        onConflict:
          'id',
      },
    );

  if (upsertError) {
    console.error(
      'Erro ao salvar enigmas:',
      upsertError,
    );

    throw upsertError;
  }
}