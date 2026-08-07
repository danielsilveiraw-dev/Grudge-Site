import Image from 'next/image';

import { getRiddles } from '@/lib/riddles';
import { requireAdminPage } from '@/lib/admin-access';

import {
  addRiddleAction,
  updateRiddleAction,
  deleteRiddleAction,
} from './actions';

import AdminHeader from '../AdminHeader';

export default async function AdminEnigmasPage() {
  // Proteção real da página de enigmas
  await requireAdminPage('riddles');

  const riddles = await getRiddles();

  return (
    <main className="relative z-[1] mx-auto max-w-[820px] px-6 pb-20 pt-[120px]">
      <AdminHeader
        title="gerenciar enigmas"
        subtitle="adicione mensagens, imagens e links opcionais"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          novo enigma
        </h2>

        <form
          action={addRiddleAction}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="new-riddle-title"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              título
            </label>

            <input
              id="new-riddle-title"
              name="title"
              type="text"
              required
              placeholder="ex: Enigma 3"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-riddle-clue"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              mensagem ou pista
            </label>

            <textarea
              id="new-riddle-clue"
              name="clue"
              rows={5}
              placeholder="escreva a mensagem ou pista do enigma..."
              className="w-full resize-y rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-riddle-button-text"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                texto do botão (opcional)
              </label>

              <input
                id="new-riddle-button-text"
                name="buttonText"
                type="text"
                placeholder="ex: acessar pista"
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-riddle-url"
                className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
              >
                link do botão (opcional)
              </label>

              <input
                id="new-riddle-url"
                name="url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[0.72rem] leading-relaxed text-text-dim">
            O botão só aparecerá quando o texto e o link
            estiverem preenchidos.
          </p>

          <div>
            <label
              htmlFor="new-riddle-image"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              imagem opcional
            </label>

            <input
              id="new-riddle-image"
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
            adicionar enigma
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          enigmas cadastrados
        </h2>

        {riddles.length === 0 ? (
          <p className="text-[0.85rem] text-text-dim">
            nenhum enigma cadastrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {riddles.map((riddle) => {
              const hasButton = Boolean(
                riddle.buttonText && riddle.url,
              );

              return (
                <li
                  key={riddle.id}
                  className="rounded-xl border border-line-soft bg-bg-deep/40 p-4"
                >
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block truncate font-display text-lg text-text-main">
                          {riddle.title}
                        </span>

                        <span className="text-[0.68rem] uppercase tracking-wide text-text-dim">
                          {hasButton
                            ? 'mensagem com botão'
                            : 'mensagem'}
                        </span>
                      </div>

                      <span className="text-[0.7rem] uppercase tracking-wide text-text-dim">
                        editar
                      </span>
                    </summary>

                    {riddle.image && (
                      <div className="mt-4">
                        <Image
                          src={riddle.image}
                          alt={riddle.title}
                          width={720}
                          height={400}
                          className="max-h-[280px] w-full rounded-xl object-cover"
                        />
                      </div>
                    )}

                    <form
                      action={updateRiddleAction}
                      className="mt-4 flex flex-col gap-4"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={riddle.id}
                      />

                      <div>
                        <label
                          htmlFor={`edit-${riddle.id}-title`}
                          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
                        >
                          título
                        </label>

                        <input
                          id={`edit-${riddle.id}-title`}
                          name="title"
                          type="text"
                          defaultValue={riddle.title}
                          required
                          className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-${riddle.id}-clue`}
                          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
                        >
                          mensagem ou pista
                        </label>

                        <textarea
                          id={`edit-${riddle.id}-clue`}
                          name="clue"
                          rows={5}
                          defaultValue={riddle.clue}
                          placeholder="escreva a mensagem ou pista..."
                          className="w-full resize-y rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-${riddle.id}-button-text`}
                            className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
                          >
                            texto do botão
                          </label>

                          <input
                            id={`edit-${riddle.id}-button-text`}
                            name="buttonText"
                            type="text"
                            defaultValue={
                              riddle.buttonText ?? ''
                            }
                            placeholder="ex: acessar pista"
                            className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-${riddle.id}-url`}
                            className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
                          >
                            link do botão
                          </label>

                          <input
                            id={`edit-${riddle.id}-url`}
                            name="url"
                            type="url"
                            defaultValue={riddle.url ?? ''}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
                          />
                        </div>
                      </div>

                      <p className="text-[0.72rem] leading-relaxed text-text-dim">
                        Para remover o botão, deixe um dos
                        dois campos acima vazio.
                      </p>

                      <div>
                        <label
                          htmlFor={`edit-${riddle.id}-image`}
                          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
                        >
                          substituir imagem
                        </label>

                        <input
                          id={`edit-${riddle.id}-image`}
                          name="image"
                          type="file"
                          accept="image/*"
                          className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
                        />
                      </div>

                      {riddle.image && (
                        <label className="flex items-center gap-2 text-[0.78rem] text-text-dim">
                          <input
                            type="checkbox"
                            name="removeImage"
                            className="accent-accent-hot"
                          />

                          remover imagem atual
                        </label>
                      )}

                      <button
                        type="submit"
                        className="w-fit rounded-lg bg-accent-hot px-4 py-2 text-[0.78rem] font-bold text-bg-deep transition hover:brightness-110"
                      >
                        salvar alterações
                      </button>
                    </form>

                    <form
                      action={deleteRiddleAction}
                      className="mt-3"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={riddle.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-line-soft px-3 py-2 text-[0.72rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
                      >
                        remover enigma
                      </button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}