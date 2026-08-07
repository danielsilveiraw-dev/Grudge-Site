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

export default async function ApoiePage() {
  const data = await getSupportData();

  return (
    <main className="relative z-[1] mx-auto max-w-[1150px] px-4 pb-24 pt-[120px] sm:px-6">
      <header className="mx-auto mb-12 max-w-[650px] text-center">
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-accent-hot">
          segunda temporada
        </p>

        <h1 className="font-display text-[clamp(3rem,8vw,5rem)] font-semibold uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_45px_rgba(255,61,129,0.35)]">
          Apoie
        </h1>

        <p className="mx-auto mt-4 max-w-[540px] font-display text-[1rem] italic leading-relaxed text-text-dim">
          Ajude a construir o próximo capítulo do Grudge SMP.
        </p>
      </header>

      <div className="grid gap-7 lg:grid-cols-[1fr_260px]">
        <div>
          {/* PROGRESSO */}
          <section className="mb-8 rounded-[28px] border border-line-soft bg-bg-mid/30 p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.2)] backdrop-blur-md sm:p-9">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-text-dim">
              progresso da campanha
            </p>

            <div className="mt-3 font-display text-[clamp(3.8rem,12vw,7rem)] font-semibold leading-none text-accent-hot [text-shadow:0_0_40px_rgba(255,61,129,0.32)]">
              {data.progress}%
            </div>

            <div className="mx-auto mt-6 h-3 w-full max-w-[620px] overflow-hidden rounded-full border border-line-soft bg-bg-deep/60">
              <div
                className="h-full rounded-full bg-accent-hot shadow-[0_0_20px_rgba(255,61,129,0.55)] transition-all duration-700"
                style={{
                  width: `${data.progress}%`,
                }}
              />
            </div>

            <p className="mx-auto mt-6 max-w-[560px] text-[0.88rem] leading-relaxed text-text-dim">
              Cada apoio aproxima o projeto da próxima temporada.
            </p>

            {data.supportUrl ? (
              <a
                href={data.supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-hot px-7 py-3 font-bold uppercase tracking-[0.08em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Apoie aqui

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
              <p className="mt-6 text-[0.75rem] text-text-dim">
                O link de apoio será disponibilizado em breve.
              </p>
            )}
          </section>

          {/* VANTAGENS */}
          <section>
            <div className="mb-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent-hot">
                por que apoiar?
              </p>

              <h2 className="mt-1 font-display text-2xl text-text-main">
                Ajude o Grudge a crescer
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <article
                  key={benefit.title}
                  className="group rounded-[22px] border border-line-soft bg-bg-mid/25 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-accent-hot/60 hover:shadow-[0_18px_50px_rgba(255,61,129,0.06)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line-soft bg-accent-hot/10 text-accent-hot transition duration-300 group-hover:bg-accent-hot group-hover:text-bg-deep">
                    {benefit.icon}
                  </div>

                  <h3 className="mt-5 font-display text-xl text-text-main">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-[0.82rem] leading-relaxed text-text-dim">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* APOIADORES */}
        <aside className="lg:sticky lg:top-[110px] lg:self-start">
          <div className="rounded-[22px] border border-line-soft bg-bg-mid/30 p-5 backdrop-blur-md">
            <div className="mb-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-accent-hot">
                comunidade
              </p>

              <h2 className="mt-1 font-display text-2xl text-text-main">
                Apoiadores
              </h2>

              <p className="mt-1 text-[0.7rem] text-text-dim">
                {data.supporters.length}{' '}
                {data.supporters.length === 1
                  ? 'apoiador'
                  : 'apoiadores'}
              </p>
            </div>

            {data.supporters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-soft p-4">
                <p className="text-[0.78rem] leading-relaxed text-text-dim">
                  Os primeiros nomes aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
                {data.supporters.map(
                  (supporter, index) => (
                    <div
                      key={supporter.id}
                      className="flex items-center gap-3 rounded-xl border border-line-soft bg-bg-deep/30 px-3 py-2.5 transition hover:border-accent-hot/40"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-hot/30 bg-accent-hot/10 text-[0.65rem] font-bold text-accent-hot">
                        {String(index + 1).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <span className="truncate text-[0.78rem] text-text-main">
                        {supporter.name}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}