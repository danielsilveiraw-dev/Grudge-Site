import { getSupabaseServer } from '@/lib/supabase-server';

export const STAFF_PERMISSIONS = [
  'calendar',
  'riddles',
  'music',
  'streamers',
  'logs',
  'staffs',
  'support',
] as const;

export type NormalStaffPermission =
  (typeof STAFF_PERMISSIONS)[number];

export type StaffPermission =
  | NormalStaffPermission
  | 'all';

export type StaffMember = {
  discordId: string;

  name?: string;
  image?: string;

  role: string;
  permissions: StaffPermission[];

  createdAt: string;

  addedBy?: string;
  addedByDiscordId?: string;

  lastLoginAt?: string;
};

function isPermission(
  value: unknown,
): value is StaffPermission {
  return (
    value === 'all' ||
    STAFF_PERMISSIONS.includes(
      value as NormalStaffPermission,
    )
  );
}

function normalizePermissions(
  value: unknown,
): StaffPermission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPermission);
}

export async function getStaffMembers(): Promise<
  StaffMember[]
> {
  const supabase = getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('staff')
    .select(
      `
        discord_id,
        name,
        image,
        role,
        permissions,
        created_at,
        added_by,
        added_by_discord_id,
        last_login_at
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
      'Erro ao carregar staffs:',
      error,
    );

    return [];
  }

  return (data ?? []).map(
    (row) => ({
      discordId:
        row.discord_id,

      name:
        typeof row.name === 'string'
          ? row.name
          : undefined,

      image:
        typeof row.image === 'string'
          ? row.image
          : undefined,

      role:
        typeof row.role === 'string' &&
        row.role.trim()
          ? row.role.trim()
          : 'Staff',

      permissions:
        normalizePermissions(
          row.permissions,
        ),

      createdAt:
        row.created_at ??
        new Date().toISOString(),

      addedBy:
        typeof row.added_by === 'string'
          ? row.added_by
          : undefined,

      addedByDiscordId:
        typeof row.added_by_discord_id ===
        'string'
          ? row.added_by_discord_id
          : undefined,

      lastLoginAt:
        row.last_login_at ??
        undefined,
    }),
  );
}

export async function saveStaffMembers(
  members: StaffMember[],
): Promise<void> {
  const supabase = getSupabaseServer();

  const {
    data: existingRows,
    error: readError,
  } = await supabase
    .from('staff')
    .select('discord_id');

  if (readError) {
    console.error(
      'Erro ao verificar staffs existentes:',
      readError,
    );

    throw readError;
  }

  const existingIds = new Set(
    (existingRows ?? []).map(
      (row) =>
        String(
          row.discord_id,
        ),
    ),
  );

  const nextIds = new Set(
    members.map(
      (member) =>
        member.discordId,
    ),
  );

  const idsToDelete = [
    ...existingIds,
  ].filter(
    (discordId) =>
      !nextIds.has(
        discordId,
      ),
  );

  if (idsToDelete.length > 0) {
    const {
      error: deleteError,
    } = await supabase
      .from('staff')
      .delete()
      .in(
        'discord_id',
        idsToDelete,
      );

    if (deleteError) {
      console.error(
        'Erro ao remover staffs:',
        deleteError,
      );

      throw deleteError;
    }
  }

  if (
    members.length === 0
  ) {
    return;
  }

  const rows = members.map(
    (member) => ({
      discord_id:
        member.discordId,

      name:
        member.name ??
        null,

      image:
        member.image ??
        null,

      role:
        member.role,

      permissions:
        member.permissions,

      created_at:
        member.createdAt,

      added_by:
        member.addedBy ??
        null,

      added_by_discord_id:
        member.addedByDiscordId ??
        null,

      last_login_at:
        member.lastLoginAt ??
        null,
    }),
  );

  const {
    error: upsertError,
  } = await supabase
    .from('staff')
    .upsert(
      rows,
      {
        onConflict:
          'discord_id',
      },
    );

  if (upsertError) {
    console.error(
      'Erro ao salvar staffs:',
      upsertError,
    );

    throw upsertError;
  }
}

/**
 * Procura um membro da staff pelo ID permanente
 * da conta do Discord.
 */
export async function getStaffByDiscordId(
  discordId: string,
): Promise<StaffMember | null> {
  if (!discordId) {
    return null;
  }

  const supabase =
    getSupabaseServer();

  const {
    data,
    error,
  } = await supabase
    .from('staff')
    .select(
      `
        discord_id,
        name,
        image,
        role,
        permissions,
        created_at,
        added_by,
        added_by_discord_id,
        last_login_at
      `,
    )
    .eq(
      'discord_id',
      discordId,
    )
    .maybeSingle();

  if (error) {
    console.error(
      'Erro ao buscar staff:',
      error,
    );

    return null;
  }

  if (!data) {
    return null;
  }

  return {
    discordId:
      data.discord_id,

    name:
      typeof data.name === 'string'
        ? data.name
        : undefined,

    image:
      typeof data.image === 'string'
        ? data.image
        : undefined,

    role:
      typeof data.role === 'string' &&
      data.role.trim()
        ? data.role.trim()
        : 'Staff',

    permissions:
      normalizePermissions(
        data.permissions,
      ),

    createdAt:
      data.created_at ??
      new Date().toISOString(),

    addedBy:
      typeof data.added_by === 'string'
        ? data.added_by
        : undefined,

    addedByDiscordId:
      typeof data.added_by_discord_id ===
      'string'
        ? data.added_by_discord_id
        : undefined,

    lastLoginAt:
      data.last_login_at ??
      undefined,
  };
}

export function staffHasPermission(
  staff: StaffMember,
  permission: StaffPermission,
): boolean {
  return (
    staff.permissions.includes('all') ||
    staff.permissions.includes(permission)
  );
}

/**
 * Atualiza nome, foto e último acesso depois
 * que uma conta autorizada entra pelo Discord.
 */
export async function updateStaffDiscordProfile({
  discordId,
  name,
  image,
}: {
  discordId: string;
  name?: string | null;
  image?: string | null;
}): Promise<void> {
  const supabase =
    getSupabaseServer();

  const updates: {
    name?: string;
    image?: string;
    last_login_at: string;
  } = {
    last_login_at:
      new Date().toISOString(),
  };

  if (name?.trim()) {
    updates.name =
      name.trim();
  }

  if (image?.trim()) {
    updates.image =
      image.trim();
  }

  const {
    error,
  } = await supabase
    .from('staff')
    .update(
      updates,
    )
    .eq(
      'discord_id',
      discordId,
    );

  if (error) {
    console.error(
      'Erro ao atualizar perfil do staff:',
      error,
    );

    throw error;
  }
}