import { getSupabaseServer } from '@/lib/supabase-server';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  description?: string;
  image?: string;
};

type EventRow = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  image: string | null;
};

export async function getEvents(): Promise<CalendarEvent[]> {
  const supabase = getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('events')
    .select(
      'id, title, date, description, image',
    )
    .order('date', {
      ascending: true,
    });

  if (error) {
    console.error(
      'Erro ao buscar eventos:',
      error,
    );

    return [];
  }

  return ((data ?? []) as EventRow[]).map(
    (event) => ({
      id: event.id,
      title: event.title,
      date: event.date,

      description:
        event.description ??
        undefined,

      image:
        event.image ??
        undefined,
    }),
  );
}

export async function saveEvents(
  events: CalendarEvent[],
): Promise<void> {
  const supabase = getSupabaseServer();

  /*
   * Mantemos esta função porque as Server Actions
   * atuais trabalham com getEvents() + saveEvents().
   *
   * Primeiro buscamos os IDs atuais do banco.
   */
  const {
    data: existingRows,
    error: readError,
  } = await supabase
    .from('events')
    .select('id');

  if (readError) {
    console.error(
      'Erro ao verificar eventos existentes:',
      readError,
    );

    throw readError;
  }

  const existingIds = new Set(
    (existingRows ?? []).map(
      (row) => row.id as string,
    ),
  );

  const nextIds = new Set(
    events.map(
      (event) => event.id,
    ),
  );

  /*
   * Remove do Supabase os eventos que
   * deixaram de existir na lista.
   */
  const idsToDelete = [
    ...existingIds,
  ].filter(
    (id) =>
      !nextIds.has(id),
  );

  if (idsToDelete.length > 0) {
    const {
      error: deleteError,
    } = await supabase
      .from('events')
      .delete()
      .in(
        'id',
        idsToDelete,
      );

    if (deleteError) {
      console.error(
        'Erro ao remover eventos:',
        deleteError,
      );

      throw deleteError;
    }
  }

  /*
   * Insere eventos novos e atualiza
   * os que já existem.
   */
  if (events.length > 0) {
    const rows = events.map(
      (event) => ({
        id: event.id,
        title: event.title,
        date: event.date,

        description:
          event.description ??
          null,

        image:
          event.image ??
          null,
      }),
    );

    const {
      error: upsertError,
    } = await supabase
      .from('events')
      .upsert(
        rows,
        {
          onConflict: 'id',
        },
      );

    if (upsertError) {
      console.error(
        'Erro ao salvar eventos:',
        upsertError,
      );

      throw upsertError;
    }
  }
}