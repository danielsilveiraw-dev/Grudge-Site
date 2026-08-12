import Image from 'next/image';
import Link from 'next/link';

import SocialIcons from '@/components/SocialIcons';
import Player from '@/components/Player';
import HelpBubble from '@/components/HelpBubble';
import HomeAtmosphere from '@/components/HomeAtmosphere';

import { getSongs } from '@/lib/music';
import { getSupportData } from '@/lib/support';
import { getEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [songs, support, events] =
    await Promise.all([
      getSongs(),
      getSupportData(),
      getEvents(),
    ]);

  const supporters =
    support.supporters.slice(0, 12);

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const nextEvent =
    events.find((event) => {
      const eventDate =
        new Date(
          `${event.date}T00:00:00`,
        );

      return eventDate >= today;
    });

  return (
    <main className="relative z-[1] flex min-h-screen flex-col px-6 pb-8 pt-28">
      <HomeAtmosphere />

      {/* INFORMAÇÕES LATERAIS - TELAS GRANDES */}
      <div className="pointer-events-none absolute inset-0 z-[2] hidden 2xl:block">
        {/* PRÓXIMO EVENTO - ESQUERDA */}
        <div className="pointer-events-auto absolute left-[5vw] top-1/2 w-[230px] -translate-y-1/2">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-[5px] w-[5px] rounded-full bg-accent-hot shadow-[0_0_12px_rgba(255,61,129,0.8)]" />

            <span className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-accent-hot">
              próximo evento
            </span>
          </div>

          {nextEvent ? (
            <>
              <h2 className="font-display text-[1.7rem] leading-tight text-text-main">
                {nextEvent.title}
              </h2>

              <p className="mt-3 text-[0.68rem] uppercase tracking-[0.14em] text-text-dim">
                {new Date(
                  `${nextEvent.date}T00:00:00`,
                ).toLocaleDateString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: 'long',
                  },
                )}
              </p>

              {nextEvent.description && (
                <p className="mt-4 line-clamp-3 text-[0.7rem] leading-relaxed text-text-dim/80">
                  {nextEvent.description}
                </p>
              )}

              <Link
                href="/calendario"
                className="mt-5 inline-flex text-[0.6rem] font-bold uppercase tracking-[0.16em] text-text-dim transition hover:text-accent-hot"
              >
                ver calendário →
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-[1.35rem] italic text-text-main">
                O próximo sinal ainda não foi revelado.
              </p>

              <Link
                href="/calendario"
                className="mt-5 inline-flex text-[0.6rem] font-bold uppercase tracking-[0.16em] text-text-dim transition hover:text-accent-hot"
              >
                ver calendário →
              </Link>
            </>
          )}

          <div className="mt-6 h-px w-[90px] bg-gradient-to-r from-accent-hot/40 to-transparent" />
        </div>

        {/* APOIE - DIREITA */}
        <div className="pointer-events-auto absolute right-[5vw] top-1/2 w-[230px] -translate-y-1/2">
          <div className="mb-4 flex items-center justify-end gap-3">
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-accent-hot">
              apoie o projeto
            </span>

            <span className="h-[5px] w-[5px] rounded-full bg-accent-hot shadow-[0_0_12px_rgba(255,61,129,0.8)]" />
          </div>

          <div className="text-right">
            <div className="flex items-end justify-end gap-2">
              <strong className="font-display text-[3.2rem] font-medium leading-none text-text-main">
                {Math.round(
                  support.progress,
                )}
              </strong>

              <span className="mb-1 text-sm text-accent-hot">
                %
              </span>
            </div>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-text-dim/80">
              Ajude o Grudge SMP a continuar crescendo.
            </p>

            <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-line-soft/40">
              <div
                className="h-full rounded-full bg-accent-hot shadow-[0_0_12px_rgba(255,61,129,0.5)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      support.progress,
                    ),
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[0.5rem] uppercase tracking-[0.12em] text-text-dim/50">
              <span>0</span>
              <span>meta</span>
            </div>

            <Link
              href="/apoie"
              className="mt-5 inline-flex text-[0.6rem] font-bold uppercase tracking-[0.16em] text-text-dim transition hover:text-accent-hot"
            >
              quero apoiar →
            </Link>
          </div>

          <div className="ml-auto mt-6 h-px w-[90px] bg-gradient-to-l from-accent-hot/40 to-transparent" />
        </div>
      </div>

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