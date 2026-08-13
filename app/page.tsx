import Image from 'next/image';
import Link from 'next/link';

import SocialIcons from '@/components/SocialIcons';
import Player from '@/components/Player';
import HelpBubble from '@/components/HelpBubble';
import HomeAtmosphere from '@/components/HomeAtmosphere';

import { getSongs } from '@/lib/music';
import { getSupportData } from '@/lib/support';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [songs, support] =
    await Promise.all([
      getSongs(),
      getSupportData(),
    ]);

  const supporters =
    support.supporters.slice(0, 12);

  return (
    <main className="relative z-[1] flex min-h-screen flex-col px-6 pb-8 pt-28">
      <HomeAtmosphere />

      <section className="relative z-[1] mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center py-14 text-center">
        {/* LOGO GRUDGE SMP */}
        <div className="relative mb-8 flex w-full items-center justify-center">
          <div className="absolute h-[180px] w-[500px] max-w-full rounded-full bg-accent-hot/10 blur-3xl" />

          <Image
            src="/assets/grudge-logo.png"
            alt="Logo do Grudge SMP"
            width={1536}
            height={512}
            priority
            className="relative h-auto w-[min(94vw,760px)] object-contain drop-shadow-[0_0_45px_rgba(255,61,129,0.35)]"
          />
        </div>

        {/* FRASE */}
        <header className="mb-8">
          <p className="mx-auto max-w-[540px] font-display text-[1rem] italic leading-relaxed text-text-dim sm:text-[1.1rem]">
            Entre no caos. Descubra o desconhecido.
          </p>
        </header>

        {/* REDES SOCIAIS */}
        <div className="mb-8">
          <SocialIcons />
        </div>

        {/* PLAYER */}
        <div className="relative flex min-h-[72px] w-full items-center justify-center">
          <Player
            songs={songs}
            variant="inline"
          />
        </div>

        {/* LINHA DECORATIVA */}
        <div className="mt-10 h-px w-full max-w-[520px] bg-gradient-to-r from-transparent via-line-soft to-transparent" />
      </section>

      {/* APOIADORES */}
      <section className="relative z-[1] mx-auto mb-14 w-full max-w-[900px]">
        <div className="rounded-[24px] border border-line-soft bg-bg-mid/20 p-6 backdrop-blur-sm sm:p-8">
          <div className="text-center">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
              nossos apoiadores
            </p>

            <h2 className="mt-2 font-display text-3xl text-text-main">
              Quem ajuda o projeto a continuar
            </h2>

            <p className="mx-auto mt-3 max-w-[520px] text-[0.78rem] leading-relaxed text-text-dim">
              Pessoas que ajudam a tornar os próximos capítulos possíveis.
            </p>
          </div>

          {supporters.length > 0 ? (
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {supporters.map(
                (supporter) => (
                  <div
                    key={supporter.id}
                    className="rounded-full border border-line-soft bg-bg-deep/40 px-4 py-2 text-[0.75rem] text-text-main transition hover:border-accent-hot/50 hover:text-accent-hot"
                  >
                    ✦ {supporter.name}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="mt-7 text-center font-display text-[1rem] italic text-text-dim">
              Os primeiros nomes ainda estão por vir.
            </p>
          )}

          <div className="mt-7 text-center">
            <Link
              href="/apoie"
              className="inline-flex rounded-xl border border-accent-hot/40 bg-accent-hot/10 px-5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-hot transition hover:bg-accent-hot hover:text-bg-deep"
            >
              ver página de apoio
            </Link>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="relative z-[1] mx-auto flex w-full max-w-[1100px] flex-col gap-3 border-t border-line-soft/70 pt-5 text-center text-[0.7rem] text-text-dim sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span>
          Feito por{' '}
          <span className="font-bold text-text-main transition hover:text-accent-hot">
            NextDevs
          </span>
        </span>

        <span>
          © 2026 Grudge SMP. Todos os direitos reservados.
        </span>
      </footer>

      <HelpBubble />
    </main>
  );
}