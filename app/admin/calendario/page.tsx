import Image from 'next/image';

import { getEvents } from '@/lib/events';
import { requireAdminPage } from '@/lib/admin-access';

import {
  addEventAction,
  deleteEventAction,
} from './actions';

import AdminHeader from '../AdminHeader';

export default async function AdminCalendarioPage() {
  // 🔒 Proteção real da página
  await requireAdminPage('calendar');

  const events = await getEvents();

  return (
    <main className="relative z-[1] mx-auto max-w-[820px] px-6 pb-20 pt-[120px]">
      <AdminHeader
        title="gerenciar calendário"
        subtitle="adicione e remova eventos do calendário"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          novo evento
        </h2>

        <form
          action={addEventAction}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              título
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="ex: Reset do mapa, Evento de PvP..."
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              data
            </label>

            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              descrição (opcional)
            </label>

            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="detalhes do evento..."
              className="w-full resize-y rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              imagem (opcional)
            </label>

            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            adicionar evento
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          eventos cadastrados
        </h2>

        {events.length === 0 ? (
          <p className="text-[0.85rem] text-text-dim">
            nenhum evento cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-4 rounded-xl border border-line-soft bg-bg-deep/40 p-4"
              >
                {event.image ? (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-bg-mid/60" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg text-text-main">
                    {event.title}
                  </p>

                  <p className="text-[0.75rem] text-text-dim">
                    {new Date(
                      event.date + 'T00:00:00',
                    ).toLocaleDateString('pt-BR')}
                  </p>

                  {event.description && (
                    <p className="mt-1 truncate text-[0.78rem] text-text-dim">
                      {event.description}
                    </p>
                  )}
                </div>

                <form action={deleteEventAction}>
                  <input
                    type="hidden"
                    name="id"
                    value={event.id}
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