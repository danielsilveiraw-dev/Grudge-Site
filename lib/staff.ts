import fs from 'fs/promises';
import path from 'path';

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

const STAFF_FILE = path.join(
  process.cwd(),
  'data',
  'staff.json',
);

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

export async function getStaffMembers(): Promise<
  StaffMember[]
> {
  try {
    const raw = await fs.readFile(
      STAFF_FILE,
      'utf8',
    );

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item): StaffMember | null => {
        if (
          !item ||
          typeof item !== 'object'
        ) {
          return null;
        }

        const record =
          item as Record<string, unknown>;

        const discordId = String(
          record.discordId ?? '',
        ).trim();

        if (!discordId) {
          return null;
        }

        const permissions = Array.isArray(
          record.permissions,
        )
          ? record.permissions.filter(
              isPermission,
            )
          : [];

        return {
          discordId,

          name:
            typeof record.name === 'string'
              ? record.name
              : undefined,

          image:
            typeof record.image === 'string'
              ? record.image
              : undefined,

          role:
            typeof record.role === 'string' &&
            record.role.trim()
              ? record.role.trim()
              : 'Staff',

          permissions,

          createdAt:
            typeof record.createdAt === 'string'
              ? record.createdAt
              : new Date().toISOString(),

          addedBy:
            typeof record.addedBy === 'string'
              ? record.addedBy
              : undefined,

          addedByDiscordId:
            typeof record.addedByDiscordId ===
            'string'
              ? record.addedByDiscordId
              : undefined,

          lastLoginAt:
            typeof record.lastLoginAt === 'string'
              ? record.lastLoginAt
              : undefined,
        };
      })
      .filter(
        (member): member is StaffMember =>
          member !== null,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar staffs:',
      error,
    );

    return [];
  }
}

export async function saveStaffMembers(
  members: StaffMember[],
): Promise<void> {
  await fs.mkdir(
    path.dirname(STAFF_FILE),
    {
      recursive: true,
    },
  );

  await fs.writeFile(
    STAFF_FILE,
    JSON.stringify(members, null, 2),
    'utf8',
  );
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

  const members = await getStaffMembers();

  return (
    members.find(
      (member) =>
        member.discordId === discordId,
    ) ?? null
  );
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
  const members = await getStaffMembers();

  const memberIndex = members.findIndex(
    (member) =>
      member.discordId === discordId,
  );

  if (memberIndex === -1) {
    return;
  }

  members[memberIndex] = {
    ...members[memberIndex],

    name:
      name?.trim() ||
      members[memberIndex].name,

    image:
      image?.trim() ||
      members[memberIndex].image,

    lastLoginAt: new Date().toISOString(),
  };

  await saveStaffMembers(members);
}