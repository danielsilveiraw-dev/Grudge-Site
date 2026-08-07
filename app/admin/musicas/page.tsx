import Image from 'next/image';

import AdminHeader from '../AdminHeader';

import {
  getSongs,
  SITE_PAGES,
  type SitePage,
} from '@/lib/music';

import { requireAdminPage } from '@/lib/admin-access';

import {
  addSongAction,
  deleteSongAction,
  updateSongPagesAction,
} from './actions';

export const dynamic = 'force-dynamic';

const PAGE_LABELS: Record<SitePage, string> = {
  '/': 'Página inicial',
  '/alfabeto': 'Alfabeto',
  '/calendario': 'Calendário',
  '/enigmas': 'Enigmas',
};

export default async function AdminMusicasPage() {
  // Proteção real da página de músicas
  await requireAdminPage('music');

  const songs = await getSongs();

  return (
    <main className="relative z-[1] mx-auto max-w-[820px] px-6 pb-20 pt-[120px]">
      <AdminHeader
        title="gerenciar músicas"
        subtitle="adicione músicas e escolha em quais páginas elas podem aparecer"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          nova música
        </h2>

        <form
          action={addSongAction}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              nome da música
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="ex: Ordinary Love - Vicki Vox"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="audio"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              arquivo de áudio
            </label>

            <input
              id="audio"
              name="audio"
              type="file"
              required
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
            />
          </div>

          <div>
            <label
              htmlFor="cover"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              capa da música (opcional)
            </label>

            <input
              id="cover"
              name="cover"
              type="file"
              accept="image/*"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
            />
          </div>

          <fieldset className="rounded-xl border border-line-soft bg-bg-deep/30 p-4">
            <legend className="px-1 text-[0.7rem] uppercase tracking-[0.12em] text-text-dim">
              páginas onde a música aparecerá
            </legend>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {SITE_PAGES.map((page) => (
                <label
                  key={page}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-soft px-3 py-2 text-[0.82rem] text-text-main transition hover:border-accent-hot"
                >
                  <input
                    type="checkbox"
                    name="pages"
                    value={page}
                    defaultChecked={page === '/'}
                    className="accent-accent-hot"
                  />

                  {PAGE_LABELS[page]}
                </label>
              ))}
            </div>

            <p className="mt-3 text-[0.7rem] text-text-dim">
              Selecione pelo menos uma página.
            </p>
          </fieldset>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            adicionar música
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          músicas cadastradas
        </h2>

        {songs.length === 0 ? (
          <p className="text-[0.85rem] text-text-dim">
            nenhuma música cadastrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {songs.map((song) => (
              <li
                key={song.id}
                className="rounded-xl border border-line-soft bg-bg-deep/40 p-4"
              >
                <div className="flex items-center gap-4">
                  {song.cover ? (
                    <Image
                      src={song.cover}
                      alt={song.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-bg-mid/60 text-xl text-text-dim">
                      ♪
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg text-text-main">
                      {song.name}
                    </p>

                    <p className="truncate text-[0.75rem] text-text-dim">
                      {song.audio}
                    </p>

                    <p className="mt-1 text-[0.7rem] text-text-dim">
                      adicionada em{' '}
                      {new Date(
                        song.createdAt,
                      ).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <form
                  action={updateSongPagesAction}
                  className="mt-4 rounded-xl border border-line-soft bg-bg-mid/20 p-4"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={song.id}
                  />

                  <p className="mb-3 text-[0.7rem] uppercase tracking-[0.12em] text-text-dim">
                    páginas permitidas
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {SITE_PAGES.map((page) => (
                      <label
                        key={page}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-soft px-3 py-2 text-[0.8rem] text-text-main transition hover:border-accent-hot"
                      >
                        <input
                          type="checkbox"
                          name="pages"
                          value={page}
                          defaultChecked={song.pages.includes(page)}
                          className="accent-accent-hot"
                        />

                        {PAGE_LABELS[page]}
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="mt-4 rounded-lg bg-accent-hot px-4 py-2 text-[0.78rem] font-bold text-bg-deep transition hover:brightness-110"
                  >
                    salvar páginas
                  </button>
                </form>

                <form
                  action={deleteSongAction}
                  className="mt-3"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={song.id}
                  />

                  <button
                    type="submit"
                    className="rounded-lg border border-line-soft px-3 py-2 text-[0.72rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
                  >
                    remover música
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