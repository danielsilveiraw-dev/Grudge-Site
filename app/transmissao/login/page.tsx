import Image from 'next/image';
import {
  redirect,
} from 'next/navigation';

import {
  auth,
  signIn,
} from '@/auth';

function DiscordIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.9-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.27 18.27 0 0 0-5.48 0c-.17-.4-.4-.88-.62-1.26a.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.9 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.83 19.83 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
    </svg>
  );
}

export default async function TransmissionLoginPage() {
  const session =
    await auth();

  /*
   * Já está logado.
   */
  if (
    session?.user
  ) {
    redirect(
      '/transmissao',
    );
  }

  return (
    <main className="relative z-[1] flex min-h-screen items-center justify-center overflow-hidden px-5 py-20">

      {/* ATMOSFERA */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[900px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-hot/[0.08] blur-[170px]" />

      <div className="pointer-events-none absolute left-[15%] top-[20%] h-[180px] w-[180px] rounded-full border border-accent-hot/[0.08]" />

      <div className="pointer-events-none absolute bottom-[15%] right-[12%] h-[280px] w-[280px] rounded-full border border-accent-hot/[0.05]" />

      <section className="relative w-full max-w-[470px] overflow-hidden rounded-[30px] border border-line-soft bg-bg-mid/35 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl">

        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-hot to-transparent" />

        <div className="p-7 sm:p-10">

          {/* MARCA */}
          <div className="text-center">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.3em] text-accent-hot">
              grudge // privado
            </p>

            <h1 className="mt-3 font-display text-[clamp(2.5rem,8vw,3.8rem)] font-semibold tracking-[0.02em] text-text-main [text-shadow:0_0_35px_rgba(255,61,129,0.25)]">
              Transmissão
            </h1>

            <p className="mx-auto mt-3 max-w-[340px] text-[0.78rem] leading-relaxed text-text-dim">
              Entre com sua conta do Discord para criar ou
              participar de uma sessão privada.
            </p>
          </div>

          {/* ÍCONE */}
          <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-[24px] border border-line-soft bg-bg-deep/45 text-[#8b95ff] shadow-[0_0_35px_rgba(88,101,242,0.14)]">
            <DiscordIcon
              size={38}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-line-soft bg-bg-deep/25 p-4">

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-hot/20 bg-accent-hot/[0.06] text-accent-hot">
                ✓
              </span>

              <div>
                <p className="text-[0.72rem] font-semibold text-text-main">
                  Identidade verificada
                </p>

                <p className="mt-0.5 text-[0.62rem] leading-relaxed text-text-dim">
                  Seu nome e avatar serão obtidos diretamente
                  da sua conta do Discord.
                </p>
              </div>
            </div>

          </div>

          {/* LOGIN */}
          <form
            action={async () => {
              'use server';

              await signIn(
                'discord',
                {
                  redirectTo:
                    '/transmissao',
                },
              );
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-5 py-3.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-white shadow-[0_10px_35px_rgba(88,101,242,0.22)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              <DiscordIcon />

              Entrar com Discord
            </button>
          </form>

          <p className="mx-auto mt-5 max-w-[320px] text-center text-[0.58rem] leading-relaxed text-text-dim/55">
            O login serve apenas para identificar os participantes
            das transmissões..
          </p>

        </div>
      </section>
    </main>
  );
}