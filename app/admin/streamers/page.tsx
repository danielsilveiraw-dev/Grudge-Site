import Image from 'next/image';

import AdminHeader from '../AdminHeader';

import { getStreamers } from '@/lib/streamers';
import { requireAdminPage } from '@/lib/admin-access';

import {
  addStreamerAction,
  deleteStreamerAction,
} from './actions';

export default async function AdminStreamersPage() {
  // Proteção real da página de streamers
  await requireAdminPage('streamers');

  const streamers = await getStreamers();

  return (
    <main className="relative z-[1] mx-auto max-w-[820px] px-6 pb-20 pt-[120px]">
      <AdminHeader
        title="gerenciar streamers"
        subtitle="adicione streamers e suas redes sociais"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          novo streamer
        </h2>

        <form
          action={addStreamerAction}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              nome
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="nome do streamer"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              foto
            </label>

            <input
              id="image"
              name="image"
              type="file"
              required
              accept="image/*"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="instagram"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                Instagram
              </label>

              <input
                id="instagram"
                name="instagram"
                type="url"
                placeholder="https://instagram.com/..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="youtube"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                YouTube
              </label>

              <input
                id="youtube"
                name="youtube"
                type="url"
                placeholder="https://youtube.com/..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="twitch"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                Twitch
              </label>

              <input
                id="twitch"
                name="twitch"
                type="url"
                placeholder="https://twitch.tv/..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="kick"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                Kick
              </label>

              <input
                id="kick"
                name="kick"
                type="url"
                placeholder="https://kick.com/..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="tiktok"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                TikTok
              </label>

              <input
                id="tiktok"
                name="tiktok"
                type="url"
                placeholder="https://tiktok.com/@..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            adicionar streamer
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          streamers cadastrados
        </h2>

        {streamers.length === 0 ? (
          <p className="text-[0.85rem] text-text-dim">
            nenhum streamer cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {streamers.map((streamer) => (
              <li
                key={streamer.id}
                className="flex items-center gap-4 rounded-xl border border-line-soft bg-bg-deep/40 p-4"
              >
                <Image
                  src={streamer.image}
                  alt={streamer.name}
                  width={70}
                  height={70}
                  className="h-[70px] w-[70px] flex-shrink-0 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg text-text-main">
                    {streamer.name}
                  </p>

                  <p className="mt-1 text-[0.7rem] text-text-dim">
                    cadastrado em{' '}
                    {new Date(
                      streamer.createdAt,
                    ).toLocaleDateString('pt-BR')}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {streamer.instagram && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        Instagram
                      </span>
                    )}

                    {streamer.youtube && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        YouTube
                      </span>
                    )}

                    {streamer.twitch && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        Twitch
                      </span>
                    )}

                    {streamer.kick && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        Kick
                      </span>
                    )}

                    {streamer.tiktok && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        TikTok
                      </span>
                    )}
                  </div>
                </div>

                <form action={deleteStreamerAction}>
                  <input
                    type="hidden"
                    name="id"
                    value={streamer.id}
                  />

                  <button
                    type="submit"
                    className="rounded-lg border border-line-soft px-3 py-2 text-[0.72rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
                  >
                    remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}