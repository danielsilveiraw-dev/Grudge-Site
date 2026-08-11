import { randomUUID } from 'crypto';

import { getSupabaseServer } from '@/lib/supabase-server';

export type LogEntry = {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
};

const MAX_LOGS = 300;

export async function getLogs(): Promise<LogEntry[]> {
  const supabase =
    getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('logs')
    .select(
      `
        id,
        timestamp,
        action,
        details
      `,
    )
    .order(
      'timestamp',
      {
        ascending: false,
      },
    )
    .limit(MAX_LOGS);

  if (error) {
    console.error(
      'Erro ao buscar logs:',
      error,
    );

    return [];
  }

  return (data ?? []).map(
    (log) => ({
      id:
        String(
          log.id,
        ),

      timestamp:
        String(
          log.timestamp,
        ),

      action:
        String(
          log.action,
        ),

      details:
        typeof log.details === 'string' &&
        log.details
          ? log.details
          : undefined,
    }),
  );
}

export async function addLog(
  action: string,
  details?: string,
): Promise<void> {
  const supabase =
    getSupabaseServer();

  const {
    error: insertError,
  } = await supabase
    .from('logs')
    .insert({
      id:
        randomUUID(),

      timestamp:
        new Date().toISOString(),

      action,

      details:
        details ??
        null,
    });

  if (insertError) {
    console.error(
      'Erro ao adicionar log:',
      insertError,
    );

    throw insertError;
  }

  /*
   * Mantém no máximo MAX_LOGS registros.
   *
   * Buscamos os registros que ultrapassam
   * o limite e removemos os mais antigos.
   */
  const {
    data: oldLogs,
    error: readError,
  } = await supabase
    .from('logs')
    .select('id')
    .order(
      'timestamp',
      {
        ascending: false,
      },
    )
    .range(
      MAX_LOGS,
      MAX_LOGS + 999,
    );

  if (readError) {
    console.error(
      'Erro ao verificar logs antigos:',
      readError,
    );

    return;
  }

  if (
    !oldLogs ||
    oldLogs.length === 0
  ) {
    return;
  }

  const idsToDelete =
    oldLogs.map(
      (log) =>
        String(
          log.id,
        ),
    );

  const {
    error: deleteError,
  } = await supabase
    .from('logs')
    .delete()
    .in(
      'id',
      idsToDelete,
    );

  if (deleteError) {
    console.error(
      'Erro ao limpar logs antigos:',
      deleteError,
    );
  }
}