'use client';

import {
  useState,
} from 'react';

const DISCORD_TICKET_URL =
  'https://discord.com/channels/894920634486894633/1489817377376960783';

export default function HelpBubble() {
  const [open, setOpen] =
    useState(false);

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="Abrir ajuda"
        className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-accent-hot/50 bg-bg-mid/95 text-xl text-accent-hot shadow-[0_0_30px_rgba(255,61,129,0.25)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-accent-hot hover:text-bg-deep"
      >
        ?
      </button>

      {/* FUNDO ESCURO */}
      {open && (
        <button
          type="button"
          aria-label="Fechar ajuda"
          onClick={() =>
            setOpen(false)
          }
          className="fixed inset-0 z-[81] bg-black/40 backdrop-blur-[2px]"
        />
      )}

      {/* PAINEL */}
      <aside
        className={`fixed bottom-6 right-6 z-[82] w-[calc(100vw-3rem)] max-w-[360px] overflow-hidden rounded-[24px] border border-line-soft bg-bg-deep/95 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <div className="relative p-6">
          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-line-soft text-sm text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
          >
            ×
          </button>

          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-accent-hot/30 bg-accent-hot/10 text-xl text-accent-hot">
            ?
          </div>

          <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
            suporte
          </p>

          <h2 className="mt-2 font-display text-2xl text-text-main">
            Precisa de ajuda?
          </h2>

          <p className="mt-3 text-[0.78rem] leading-relaxed text-text-dim">
            Abra um ticket no nosso Discord e fale diretamente com a equipe.
          </p>

          <a
            href={DISCORD_TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent-hot px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-bg-deep transition hover:brightness-110"
          >
            abrir ticket no Discord
          </a>

          <p className="mt-3 text-center text-[0.62rem] leading-relaxed text-text-dim">
            Você será redirecionado para o canal de suporte.
          </p>
        </div>
      </aside>
    </>
  );
}