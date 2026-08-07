import Image from 'next/image';

import {
  auth,
  signOut,
} from '@/auth';

import AdminTabs from '@/components/AdminTabs';

type AdminHeaderProps = {
  title: string;
  subtitle: string;
};

const PERMISSION_LABELS: Record<string, string> = {
  calendar: 'Calendário',
  riddles: 'Enigmas',
  music: 'Músicas',
  streamers: 'Streamers',
  logs: 'Logs',
  support: 'Apoie',
  staffs: 'Staffs',
};

export default async function AdminHeader({
  title,
  subtitle,
}: AdminHeaderProps) {
  const session = await auth();

  const user =
    session?.user as
      | (typeof session.user & {
          discordId?: string;
          permissions?: string[];
          role?: string;
        })
      | undefined;

  const permissions =
    Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  const hasFullAccess =
    permissions.includes('all');

  const permissionsText =
    hasFullAccess
      ? 'Acesso total'
      : permissions.length
        ? permissions
            .map(
              (permission) =>
                PERMISSION_LABELS[permission] ??
                permission,
            )
            .join(', ')
        : 'Sem permissões';

  const displayName =
    user?.name ?? 'Staff';

  return (
    <>
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl italic text-text-main">
            {title}
          </h1>

          <p className="mt-1 text-[0.8rem] text-text-dim">
            {subtitle}
          </p>
        </div>

        <form
          action={async () => {
            'use server';

            await signOut({
              redirectTo: '/admin/login',
            });
          }}
        >
          <button
            type="submit"
            className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
          >
            sair
          </button>
        </form>
      </header>

      <AdminTabs
        permissions={permissions}
      />

      {user && (
        <aside className="fixed bottom-4 right-4 z-50 flex max-w-[310px] items-center gap-3 rounded-2xl border border-line-soft bg-bg-deep/90 p-3 shadow-2xl backdrop-blur-xl">
          {user.image ? (
            <Image
              src={user.image}
              alt={`Foto de ${displayName}`}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl border border-line-soft object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-bg-mid/50 font-display text-xl font-bold text-accent-soft">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[0.82rem] font-bold text-text-main">
                {displayName}
              </p>

              {hasFullAccess && (
                <span className="shrink-0 rounded-full border border-accent-hot/40 bg-accent-hot/10 px-2 py-0.5 text-[0.52rem] font-bold uppercase tracking-wide text-accent-hot">
                  master
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-[0.7rem] font-medium text-accent-soft">
              {user.role ?? 'Staff'}
            </p>

            <p
              className="mt-0.5 truncate text-[0.62rem] text-text-dim"
              title={permissionsText}
            >
              {permissionsText}
            </p>
          </div>
        </aside>
      )}
    </>
  );
}