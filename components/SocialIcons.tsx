import type { ReactNode } from 'react';

type SocialLink = {
  name: string;
  href: string;
  icon: ReactNode;
};

// Troque os links "#" pelos perfis oficiais.
const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/grudgesmp/',
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 24 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
      </svg>
    ),
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/wX49zh5hKU',
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.32 4.37a19.8 19.8 0 0 0-4.9-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.27 18.27 0 0 0-5.48 0c-.17-.4-.4-.88-.62-1.26a.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.9 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.83 19.83 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@grudgesmp',
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.6 5.82c-1.02-.9-1.66-2.15-1.79-3.55h-3.05v13.66a3.13 3.13 0 1 1-2.15-2.97V9.87a6.13 6.13 0 1 0 5.2 6.06V9.4a9.13 9.13 0 0 0 4.87 1.4V7.75a5.32 5.32 0 0 1-3.08-1.93z" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com/GrudgeSMP',
    icon: (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.24 2H21l-6.53 7.46L22.1 22h-6.28l-4.9-6.4L5.24 22H2.47l6.98-7.98L1.9 2h6.44l4.43 5.85L18.24 2zm-1.1 18h1.72L7.06 3.9H5.2l11.94 16.1z" />
      </svg>
    ),
  },
];

export default function SocialIcons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          title={link.name}
          className="group flex h-11 items-center justify-center gap-0 overflow-hidden rounded-full border border-line-soft bg-bg-deep/35 px-[13px] text-text-main backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-hot hover:bg-accent-hot/10 hover:text-accent-hot"
        >
          <span className="flex shrink-0 items-center justify-center">
            {link.icon}
          </span>

          <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[0.1em] opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[100px] group-hover:opacity-100">
            {link.name}
          </span>
        </a>
      ))}
    </div>
  );
}