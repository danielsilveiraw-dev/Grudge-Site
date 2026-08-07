import Image from 'next/image';
import { getRiddles } from '@/lib/riddles';

export default async function EnigmasPage() {
  const riddles = await getRiddles();

  return (
    <main className="relative z-[1] mx-auto max-w-[980px] px-4 pb-24 pt-[120px] sm:px-6">
      <header className="mx-auto mb-14 max-w-[620px] text-center">
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-accent-hot">
          arquivos ocultos
        </p>

        <h1 className="font-custom text-[clamp(3rem,8vw,5rem)] font-semibold tracking-[0.08em] text-text-main [text-shadow:0_0_45px_rgba(255,61,129,0.35)]">
          enigmas
        </h1>

        <p className="mx-auto mt-4 max-w-[480px] font-display text-[0.98rem] italic leading-relaxed text-text-dim">
          observe os sinais, encontre as pistas e descubra o
          que está escondido
        </p>

        <div className="mx-auto mt-7 h-px w-full max-w-[340px] bg-gradient-to-r from-transparent via-accent-hot/45 to-transparent" />
      </header>

      {riddles.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-line-soft bg-bg-mid/20 px-6 py-14 text-center backdrop-blur-sm">
          <p className="font-display text-xl italic text-text-dim">
            nenhum enigma foi revelado ainda.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-7">
          {riddles.map((riddle, index) => {
            const hasMessage = Boolean(
              riddle.clue?.trim(),
            );

            const hasButton = Boolean(
              riddle.buttonText?.trim() &&
                riddle.url?.trim(),
            );

            return (
              <article
                key={riddle.id}
                className="group relative overflow-hidden rounded-[26px] border border-line-soft bg-bg-mid/25 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-300 hover:border-accent-hot/55 hover:shadow-[0_22px_70px_rgba(255,61,129,0.08)]"
              >
                <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-accent-hot/70 to-transparent opacity-50" />

                {riddle.image && (
                  <div className="relative overflow-hidden border-b border-line-soft">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg-deep/70 via-transparent to-transparent" />

                    <Image
                      src={riddle.image}
                      alt={riddle.title}
                      width={1400}
                      height={800}
                      className="max-h-[430px] w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                    />

                    <span className="absolute bottom-4 left-5 z-20 rounded-full border border-line-soft bg-bg-deep/70 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-accent-soft backdrop-blur-md">
                      arquivo{' '}
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-7">
                  {!riddle.image && (
                    <p className="mb-3 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-accent-hot">
                      arquivo{' '}
                      {String(index + 1).padStart(2, '0')}
                    </p>
                  )}

                  <h2 className="font-display text-[clamp(1.6rem,4vw,2.1rem)] font-semibold text-text-main">
                    {riddle.title}
                  </h2>

                  {hasMessage && (
                    <div className="mt-5 rounded-2xl border border-line-soft bg-bg-deep/30 p-5">
                      <p className="whitespace-pre-wrap text-[0.92rem] leading-7 text-text-main/90">
                        {riddle.clue}
                      </p>
                    </div>
                  )}

                  {hasButton && (
                    <div className="mt-6">
                      <a
                        href={riddle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/button inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-accent-hot bg-accent-hot px-5 py-3 text-[0.82rem] font-bold uppercase tracking-[0.08em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
                      >
                        <span>{riddle.buttonText}</span>

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                          className="transition group-hover/button:translate-x-0.5"
                        >
                          <path d="M7 17 17 7" />
                          <path d="M7 7h10v10" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}