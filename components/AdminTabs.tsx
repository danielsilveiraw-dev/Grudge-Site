'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminTabsProps = {
  permissions?: string[];
};

const TABS = [
  {
    label: 'Calendário',
    href: '/admin/calendario',
    permission: 'calendar',
  },
  {
    label: 'Enigmas',
    href: '/admin/enigmas',
    permission: 'riddles',
  },
  {
    label: 'Músicas',
    href: '/admin/musicas',
    permission: 'music',
  },
  {
    label: 'Streamers',
    href: '/admin/streamers',
    permission: 'streamers',
  },
  {
    label: 'Logs',
    href: '/admin/logs',
    permission: 'logs',
  },
  {
    label: 'Apoie',
    href: '/admin/apoie',
    permission: 'support',
  },
  {
    label: 'Staff',
    href: '/admin/staff',
    permission: 'staffs',
  },
];

export default function AdminTabs({
  permissions = [],
}: AdminTabsProps) {
  const pathname = usePathname();

  const safePermissions = Array.isArray(permissions)
    ? permissions
    : [];

  const hasFullAccess =
    safePermissions.includes('all');

  return (
    <nav
      aria-label="Navegação do painel administrativo"
      className="mb-8 w-full"
    >
      <div
        role="tablist"
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`);

          const hasAccess =
            hasFullAccess ||
            safePermissions.includes(tab.permission);

          if (!hasAccess) {
            return (
              <div
                key={tab.href}
                aria-disabled="true"
                title="Sem acesso"
                className="relative flex min-h-[44px] cursor-not-allowed items-center justify-center overflow-hidden rounded-xl border border-line-soft bg-bg-deep/30 px-3 py-2.5"
              >
                <span className="select-none text-center text-[0.8rem] tracking-wide text-text-dim opacity-25 blur-[1px]">
                  {tab.label}
                </span>

                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-bg-deep/25 backdrop-blur-[1px]">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-accent-soft"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>

                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.07em] text-text-dim">
                    sem acesso
                  </span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2.5 text-center text-[0.8rem] tracking-wide transition ${
                active
                  ? 'border-accent-hot bg-accent-hot font-bold text-bg-deep'
                  : 'border-line-soft text-text-dim hover:border-accent-hot hover:text-accent-hot'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}