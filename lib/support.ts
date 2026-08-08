import { getSupabaseServer } from '@/lib/supabase-server';

export type Supporter = {
  id: string;
  name: string;
  createdAt: string;
};

export type SupportData = {
  progress: number;
  supportUrl: string;
  supporters: Supporter[];
};

const DEFAULT_DATA: SupportData = {
  progress: 0,
  supportUrl: '',
  supporters: [],
};

function normalizeProgress(
  value: unknown,
) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, value),
  );
}

function normalizeSupporters(
  value: unknown,
): Supporter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => {
      if (
        !item ||
        typeof item !== 'object'
      ) {
        return false;
      }

      const supporter =
        item as Record<
          string,
          unknown
        >;

      return (
        typeof supporter.id ===
          'string' &&
        typeof supporter.name ===
          'string' &&
        typeof supporter.createdAt ===
          'string'
      );
    })
    .map((item) => {
      const supporter =
        item as Supporter;

      return {
        id: supporter.id,
        name: supporter.name,
        createdAt:
          supporter.createdAt,
      };
    });
}

export async function getSupportData(): Promise<SupportData> {
  const supabase =
    getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('support')
    .select(
      'progress, support_url, supporters',
    )
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    console.error(
      'Erro ao buscar dados do Apoie:',
      error,
    );

    return {
      ...DEFAULT_DATA,
      supporters: [],
    };
  }

  if (!data) {
    await saveSupportData(
      DEFAULT_DATA,
    );

    return {
      ...DEFAULT_DATA,
      supporters: [],
    };
  }

  return {
    progress:
      normalizeProgress(
        data.progress,
      ),

    supportUrl:
      typeof data.support_url ===
      'string'
        ? data.support_url
        : '',

    supporters:
      normalizeSupporters(
        data.supporters,
      ),
  };
}

export async function saveSupportData(
  data: SupportData,
): Promise<void> {
  const supabase =
    getSupabaseServer();

  const progress =
    normalizeProgress(
      data.progress,
    );

  const supportUrl =
    typeof data.supportUrl ===
    'string'
      ? data.supportUrl
      : '';

  const supporters =
    Array.isArray(
      data.supporters,
    )
      ? data.supporters
      : [];

  const {
    error,
  } = await supabase
    .from('support')
    .upsert(
      {
        id: 'main',
        progress,
        support_url:
          supportUrl,
        supporters,
      },
      {
        onConflict: 'id',
      },
    );

  if (error) {
    console.error(
      'Erro ao salvar dados do Apoie:',
      error,
    );

    throw error;
  }
}