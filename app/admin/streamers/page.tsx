import Image from 'next/image';

import AdminHeader from '../AdminHeader';
import AdminStreamerForm from '@/components/AdminStreamerForm';

import { getStreamers } from '@/lib/streamers';
import { requireAdminPage } from '@/lib/admin-access';

import {
  deleteStreamerAction,
} from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminStreamersPage() {
  await requireAdminPage('streamers');

  const streamers = await getStreamers();

  return (
    <main className="relative z-[1] mx-auto max-w-[900px] px-6 pb-28 pt-[120px]">
      <AdminHeader
        title="gerenciar streamers"
        subtitle="adicione e remova streamers do site"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          novo streamer
        </h2>

        <AdminStreamerForm />
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
                {streamer.image ? (
                  <Image
                    src={streamer.image}
                    alt={streamer.name}
                    width={70}
                    height={70}
                    unoptimized
                    className="h-[70px] w-[70px] flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-[70px] w-[70px] flex-shrink-0 items-center justify-center rounded-xl border border-line-soft bg-bg-mid/60 text-xl text-text-dim">
                    ?
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg text-text-main">
                    {streamer.name}
                  </p>

                  {streamer.createdAt && (
                    <p className="mt-1 text-[0.7rem] text-text-dim">
                      cadastrado em{' '}
                      {new Date(
                        streamer.createdAt,
                      ).toLocaleDateString(
                        'pt-BR',
                      )}
                    </p>
                  )}

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

                    {streamer.x && (
                      <span className="rounded-full border border-line-soft px-2 py-1 text-[0.65rem] text-text-dim">
                        X
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