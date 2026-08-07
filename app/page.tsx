import Image from 'next/image';
import SocialIcons from '@/components/SocialIcons';
import Player from '@/components/Player';
import { getSongs } from '@/lib/music';

export default async function Home() {
  const songs = await getSongs();

  return (
    <main className="relative z-[1] flex min-h-screen flex-col px-6 pb-8 pt-28">
      <section className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center py-14 text-center">

        {/* LOGO GRUDGE SMP */}
        <div className="relative mb-8 flex w-full items-center justify-center">
          {/* brilho atrás da logo */}
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

      {/* RODAPÉ */}
      <footer className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 border-t border-line-soft/70 pt-5 text-center text-[0.7rem] text-text-dim sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
    </main>
  );
}