import Image from 'next/image';
import {
  getStreamers,
  type Streamer,
} from '@/lib/streamers';

type SocialKey =
  | 'instagram'
  | 'youtube'
  | 'twitch'
  | 'kick'
  | 'tiktok';

type SocialItem = {
  key: SocialKey;
  label: string;
  icon: React.ReactNode;
};

const SOCIALS: SocialItem[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 24 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
      </svg>
    ),
  },
  {
    key: 'twitch',
    label: 'Twitch',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2 1h20v14l-5 5h-4l-3 3H7v-3H2V1zm2 2v15h5v2l2-2h5l4-4V3H4zm5 4h2v6H9V7zm5 0h2v6h-2V7z" />
      </svg>
    ),
  },
  {
    key: 'kick',
    label: 'Kick',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 2h6v7h2V7h2V5h2V3h6v6h-2v2h-2v2h2v2h2v7h-6v-5h-2v-2h-2v7H3V2z" />
      </svg>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.6 5.82c-1.02-.9-1.66-2.15-1.79-3.55h-3.05v13.66a3.13 3.13 0 1 1-2.15-2.97V9.87a6.13 6.13 0 1 0 5.2 6.06V9.4a9.13 9.13 0 0 0 4.87 1.4V7.75a5.32 5.32 0 0 1-3.08-1.93z" />
      </svg>
    ),
  },
];

function getSocialUrl(
  streamer: Streamer,
  key: SocialKey,
) {
  const value = streamer[key];

  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export default async function StreamersPage() {
  const streamers =
    await getStreamers();

  return (
    <main className="relative z-[1] mx-auto max-w-[980px] px-6 pb-20 pt-[120px]">
      <header className="mb-12 text-center">
        <h1 className="font-display text-[clamp(2.6rem,7vw,4rem)] font-semibold uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_40px_rgba(255,61,129,0.35)]">
          Streamers
        </h1>

        <p className="mt-3 font-display italic text-text-dim">
          Conheça os participantes do Grudge SMP
        </p>
      </header>

      {streamers.length === 0 ? (
        <p className="text-center text-[0.9rem] text-text-dim">
          Nenhum streamer cadastrado.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {streamers.map(
            (streamer) => {
              const availableSocials =
                SOCIALS.filter(
                  (social) =>
                    Boolean(
                      getSocialUrl(
                        streamer,
                        social.key,
                      ),
                    ),
                );

              return (
                <article
                  key={streamer.id}
                  className="group flex items-center gap-5 rounded-[20px] border border-line-soft bg-bg-mid/30 p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-accent-hot hover:shadow-[0_0_30px_rgba(255,61,129,0.1)]"
                >
                  {/* FOTO */}
                  <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-2xl sm:h-[110px] sm:w-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-accent-hot/0 transition group-hover:border-accent-hot/50" />

                    <Image
                      src={streamer.image}
                      alt={streamer.name}
                      fill
                      quality={100}
                      sizes="(max-width: 640px) 100px, 110px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-2xl text-text-main transition group-hover:text-accent-soft">
                      {streamer.name}
                    </h2>

                    {availableSocials.length >
                    0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {availableSocials.map(
                          (social) => {
                            const url =
                              getSocialUrl(
                                streamer,
                                social.key,
                              );

                            return (
                              <a
                                key={
                                  social.key
                                }
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${social.label} de ${streamer.name}`}
                                title={
                                  social.label
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-line-soft bg-bg-deep/30 text-text-main transition hover:scale-110 hover:border-accent-hot hover:bg-accent-hot/10 hover:text-accent-hot"
                              >
                                {
                                  social.icon
                                }
                              </a>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-[0.75rem] text-text-dim">
                        Nenhuma rede
                        cadastrada.
                      </p>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </main>
  );
}