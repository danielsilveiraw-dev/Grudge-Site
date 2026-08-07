'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { label: 'Menu Principal', href: '/' },
  { label: 'Alfabeto', href: '/alfabeto' },
  { label: 'Calendário', href: '/calendario' },
  { label: 'Enigmas', href: '/enigmas' },
  { label: 'Streamers', href: '/streamers' },
  { label: 'Apoie', href: '/apoie' },
];

export default function SideMenu() {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-5">
      <nav
        aria-label="Menu principal"
        className="mx-auto w-fit max-w-full rounded-full border border-line-soft bg-bg-deep/70 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <div className="flex max-w-[calc(100vw-32px)] items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MENU_ITEMS.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] transition sm:px-5 sm:text-[0.72rem] ${
                  active
                    ? 'bg-accent-hot text-bg-deep shadow-[0_0_20px_rgba(255,61,129,0.28)]'
                    : 'text-text-dim hover:bg-accent-hot/10 hover:text-accent-soft'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}