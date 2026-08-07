import AdminHeader from '../AdminHeader';

import { getSupportData } from '@/lib/support';
import { requireAdminPage } from '@/lib/admin-access';

import {
  addSupporterAction,
  deleteSupporterAction,
  updateSupportAction,
} from './actions';

export default async function AdminApoiePage() {
  // Proteção real da página Apoie
  await requireAdminPage('support');

  const data = await getSupportData();

  return (
    <main className="relative z-[1] mx-auto max-w-[900px] px-6 pb-28 pt-[120px]">
      <AdminHeader
        title="gerenciar apoio"
        subtitle="controle a campanha da segunda temporada"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          campanha
        </h2>

        <form
          action={updateSupportAction}
          className="flex flex-col gap-5"
        >
          <div>
            <label
              htmlFor="progress"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              progresso
            </label>

            <div className="flex items-center gap-3">
              <input
                id="progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                required
                defaultValue={data.progress}
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />

              <span className="font-bold text-accent-hot">
                %
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="supportUrl"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              link para apoiar
            </label>

            <input
              id="supportUrl"
              name="supportUrl"
              type="url"
              defaultValue={data.supportUrl}
              placeholder="https://..."
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            salvar campanha
          </button>
        </form>
      </section>

      <section className="rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          apoiadores
        </h2>

        <form
          action={addSupporterAction}
          className="mb-7 flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="name"
            type="text"
            required
            placeholder="nome do apoiador"
            className="flex-1 rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
          />

          <button
            type="submit"
            className="rounded-xl bg-accent-hot px-5 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            adicionar
          </button>
        </form>

        {data.supporters.length === 0 ? (
          <p className="text-[0.85rem] text-text-dim">
            nenhum apoiador cadastrado.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.supporters.map((supporter) => (
              <li
                key={supporter.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line-soft bg-bg-deep/40 px-4 py-3"
              >
                <span className="text-[0.85rem] text-text-main">
                  {supporter.name}
                </span>

                <form
                  action={deleteSupporterAction}
                >
                  <input
                    type="hidden"
                    name="id"
                    value={supporter.id}
                  />

                  <button
                    type="submit"
                    className="text-[0.7rem] text-text-dim transition hover:text-accent-hot"
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