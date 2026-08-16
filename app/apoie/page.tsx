import { getSupportData } from '@/lib/support';

const BENEFITS = [
  {
    title: 'Uma temporada maior',
    description:
      'O apoio ajuda a ampliar a estrutura, os sistemas e as possibilidades para a segunda temporada.',
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v18" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    title: 'Mais eventos',
    description:
      'Recursos extras permitem criar eventos maiores, experiências diferentes e momentos únicos no servidor.',
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    title: 'Infraestrutura',
    description:
      'Parte do apoio será usada para manter os serviços e a infraestrutura necessária para o projeto.',
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="3"
          width="16"
          height="7"
          rx="2"
        />
        <rect
          x="4"
          y="14"
          width="16"
          height="7"
          rx="2"
        />
        <path d="M8 6.5h.01" />
        <path d="M8 17.5h.01" />
      </svg>
    ),
  },
  {
    title: 'Faça parte da história',
    description:
      'Apoiadores ajudam diretamente a tornar possível o próximo capítulo do Grudge SMP.',
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
      </svg>
    ),
  },
];

const SUPPORT_LEVELS = [
  {
    roman: 'I',
    title: 'Herdeiro',
    subtitle:
      'Dê o primeiro passo para construir a próxima temporada.',
    benefits: [
      'Nosso muito obrigado por apoiar a nova temporada do Grudge',
      'Atualizações exclusivas do projeto no servidor de Apoiadores',
      'Cargo especial no Discord da Comunidade exclusivo para Apoiadores',
    ],
  },
  {
    roman: 'II',
    title: 'Marcado',
    subtitle:
      'Receba conteúdos exclusivos do universo da Segunda Temporada.',
    previous: 'Inclui tudo do Herdeiro',
    benefits: [
      'Dois wallpapers exclusivos da Segunda Temporada do Grudge',
    ],
  },
  {
    roman: 'III',
    title: 'Guardião',
    subtitle:
      'Leve um pedaço do universo do Grudge para fora do servidor.',
    previous: 'Inclui tudo do Marcado',
    benefits: [
      'Pack de emotes de personagens do projeto',
    ],
  },
  {
    roman: 'IV',
    title: 'Semideuses',
    subtitle:
      'Deixe de apenas acompanhar e participe de uma experiência do universo.',
    previous: 'Inclui tudo do Guardião',
    benefits: [
      'Participe de um Evento Spinoff do Universo do Grudge',
    ],
  },
  {
    roman: 'V',
    title: 'Escolhido',
    subtitle:
      'Entre para a história do Grudge como parte de um evento dentro do servidor.',
    previous: 'Inclui tudo do Semideuses',
    benefits: [
      'Participe de um evento dentro do servidor como um personagem',
    ],
    featured: true,
  },
];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ApoiePage() {
  const data = await getSupportData();

  const progress = Math.min(
    100,
    Math.max(
      0,
      data.progress,
    ),
  );

  return (
    <main className="relative z-[1] mx-auto max-w-[1180px] px-4 pb-24 pt-[120px] sm:px-6">
      {/* HERO */}
      <header className="relative mx-auto mb-12 max-w-[760px] text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[620px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-hot/[0.08] blur-[100px]" />

        <div className="relative">
          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-accent-hot">
            segunda temporada
          </p>

          <h1 className="font-display text-[clamp(3.3rem,9vw,6rem)] font-semibold uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_45px_rgba(255,61,129,0.38)]">
            Apoie
          </h1>

          <p className="mx-auto mt-4 max-w-[600px] font-display text-[1rem] italic leading-relaxed text-text-dim sm:text-[1.1rem]">
            Ajude a construir o próximo capítulo do Grudge SMP.
          </p>
        </div>
      </header>

      {/* PROGRESSO */}
      <section className="relative mb-16 overflow-hidden rounded-[30px] border border-line-soft bg-bg-mid/30 p-6 text-center shadow-[0_25px_90px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-[240px] w-[240px] rounded-full bg-accent-hot/[0.10] blur-[90px]" />

        <div className="pointer-events-none absolute -bottom-28 right-[-40px] h-[300px] w-[300px] rounded-full bg-accent-hot/[0.08] blur-[100px]" />

        <div className="relative">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-dim">
            progresso da campanha
          </p>

          <div className="mt-3 flex items-end justify-center gap-2">
            <strong className="font-display text-[clamp(4.5rem,13vw,8rem)] font-semibold leading-none text-accent-hot [text-shadow:0_0_45px_rgba(255,61,129,0.4)]">
              {Math.round(progress)}
            </strong>

            <span className="mb-3 font-display text-2xl text-accent-hot sm:mb-4 sm:text-3xl">
              %
            </span>
          </div>

          <div className="mx-auto mt-7 h-[10px] w-full max-w-[680px] overflow-hidden rounded-full border border-line-soft bg-bg-deep/70">
            <div
              className="h-full rounded-full bg-accent-hot shadow-[0_0_24px_rgba(255,61,129,0.65)] transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-[680px] justify-between text-[0.52rem] uppercase tracking-[0.16em] text-text-dim/50">
            <span>início</span>
            <span>meta</span>
          </div>

          <p className="mx-auto mt-6 max-w-[580px] text-[0.86rem] leading-relaxed text-text-dim">
            Cada apoio aproxima o projeto da próxima temporada e ajuda a transformar novas ideias em realidade.
          </p>

          {data.supportUrl ? (
            <a
              href={data.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-hot px-8 py-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-bg-deep shadow-[0_0_28px_rgba(255,61,129,0.2)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_36px_rgba(255,61,129,0.32)]"
            >
              Apoie o projeto

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          ) : (
            <p className="mt-7 text-[0.75rem] text-text-dim">
              O link de apoio será disponibilizado em breve.
            </p>
          )}
        </div>
      </section>

      {/* NÍVEIS */}
      <section className="mb-20">
        <div className="mx-auto mb-8 max-w-[700px] text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
            escolha seu nível
          </p>

          <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] text-text-main">
            Diferentes formas de fazer parte
          </h2>

          <p className="mx-auto mt-3 max-w-[560px] text-[0.8rem] leading-relaxed text-text-dim">
            Cada nível amplia a sua participação e desbloqueia novas formas de acompanhar e viver o universo do Grudge.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SUPPORT_LEVELS.map(
            (level) => (
              <article
                key={level.title}
                className={`group relative overflow-hidden rounded-[24px] border p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 ${
                  level.featured
                    ? 'border-accent-hot/60 bg-accent-hot/[0.08] shadow-[0_0_45px_rgba(255,61,129,0.10)] xl:col-span-1'
                    : 'border-line-soft bg-bg-mid/25 hover:border-accent-hot/50 hover:shadow-[0_20px_55px_rgba(255,61,129,0.06)]'
                }`}
              >
                <span
                  className={`pointer-events-none absolute -right-2 -top-8 select-none font-display text-[8rem] font-semibold leading-none ${
                    level.featured
                      ? 'text-accent-hot/[0.10]'
                      : 'text-text-main/[0.035]'
                  }`}
                >
                  {level.roman}
                </span>

                {level.featured && (
                  <span className="absolute right-4 top-4 rounded-full border border-accent-hot/40 bg-accent-hot/10 px-3 py-1 text-[0.52rem] font-bold uppercase tracking-[0.15em] text-accent-hot">
                    nível máximo
                  </span>
                )}

                <div className="relative">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
                    nível {level.roman}
                  </p>

                  <h3 className="mt-2 font-display text-[2rem] text-text-main">
                    {level.title}
                  </h3>

                  <p className="mt-3 min-h-[54px] text-[0.76rem] leading-relaxed text-text-dim">
                    {level.subtitle}
                  </p>

                  <div className="my-5 h-px w-full bg-gradient-to-r from-accent-hot/25 via-line-soft to-transparent" />

                  {level.previous && (
                    <p className="mb-3 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-accent-soft">
                      {level.previous}
                    </p>
                  )}

                  <ul className="space-y-3">
                    {level.benefits.map(
                      (benefit) => (
                        <li
                          key={benefit}
                          className="flex gap-3 text-[0.75rem] leading-relaxed text-text-dim"
                        >
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-hot shadow-[0_0_8px_rgba(255,61,129,0.65)]" />

                          <span>
                            {benefit}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>

                  {data.supportUrl && (
                    <a
                      href={data.supportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-7 flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition ${
                        level.featured
                          ? 'border-accent-hot bg-accent-hot text-bg-deep hover:brightness-110'
                          : 'border-accent-hot/35 bg-accent-hot/[0.06] text-accent-hot hover:bg-accent-hot hover:text-bg-deep'
                      }`}
                    >
                      conhecer este nível ↗
                    </a>
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      {/* POR QUE APOIAR */}
      <section className="mb-20">
        <div className="mb-6 text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
            por que apoiar?
          </p>

          <h2 className="mt-2 font-display text-3xl text-text-main">
            Ajude o Grudge a crescer
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(
            (benefit) => (
              <article
                key={benefit.title}
                className="group rounded-[22px] border border-line-soft bg-bg-mid/20 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-accent-hot/50 hover:bg-bg-mid/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-soft bg-accent-hot/10 text-accent-hot transition duration-300 group-hover:border-accent-hot/40 group-hover:bg-accent-hot group-hover:text-bg-deep">
                  {benefit.icon}
                </div>

                <h3 className="mt-4 font-display text-lg text-text-main">
                  {benefit.title}
                </h3>

                <p className="mt-2 text-[0.74rem] leading-relaxed text-text-dim">
                  {benefit.description}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      {/* APOIADORES */}
      <section className="mb-14">
        <div className="overflow-hidden rounded-[28px] border border-line-soft bg-bg-mid/25 p-6 backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
                comunidade
              </p>

              <h2 className="mt-1 font-display text-3xl text-text-main">
                Nomes gravados na história
              </h2>

              <p className="mt-2 max-w-[520px] text-[0.75rem] leading-relaxed text-text-dim">
                Pessoas que ajudaram diretamente a tornar possível o próximo capítulo do Grudge.
              </p>
            </div>

            <div className="shrink-0">
              <span className="font-display text-4xl text-accent-hot">
                {data.supporters.length}
              </span>

              <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-text-dim">
                {data.supporters.length === 1
                  ? 'apoiador'
                  : 'apoiadores'}
              </p>
            </div>
          </div>

          {data.supporters.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-line-soft p-6 text-center">
              <p className="font-display italic text-text-dim">
                Os primeiros nomes ainda estão por vir.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.supporters.map(
                (
                  supporter,
                  index,
                ) => (
                  <div
                    key={supporter.id}
                    className="group flex items-center gap-3 rounded-xl border border-line-soft bg-bg-deep/30 px-4 py-3 transition hover:border-accent-hot/40 hover:bg-accent-hot/[0.04]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-hot/25 bg-accent-hot/[0.08] text-[0.62rem] font-bold text-accent-hot">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>

                    <span className="truncate text-[0.78rem] text-text-main transition group-hover:text-accent-soft">
                      {supporter.name}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      {data.supportUrl && (
        <section className="relative overflow-hidden rounded-[28px] border border-accent-hot/25 bg-accent-hot/[0.06] px-6 py-10 text-center backdrop-blur-md sm:px-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-hot/[0.08] blur-[90px]" />

          <div className="relative">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
              o próximo capítulo
            </p>

            <h2 className="mx-auto mt-2 max-w-[650px] font-display text-[clamp(2rem,5vw,3.4rem)] text-text-main">
              Faça parte do que vem depois.
            </h2>

            <p className="mx-auto mt-3 max-w-[540px] text-[0.78rem] leading-relaxed text-text-dim">
              Escolha seu nível de apoio e ajude a construir a Segunda Temporada do Grudge SMP.
            </p>

            <a
              href={data.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-hot px-8 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
            >
              conhecer formas de apoio ↗
            </a>
          </div>
        </section>
      )}
    </main>
  );
}