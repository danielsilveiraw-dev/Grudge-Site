import Translator from '@/components/Translator';

export default function AlfabetoPage() {
  return (
    <main className="relative z-[1] mx-auto max-w-[900px] px-4 pb-20 pt-[120px] sm:px-6">
      <header className="mb-12 text-center">
        <h1 className="font-custom text-[clamp(3.2rem,9vw,6rem)] font-semibold tracking-[0.12em] text-text-main [text-shadow:0_0_50px_rgba(255,61,129,0.45)]">
          alfabeto oculto
      </h1>

        <p className="mx-auto mt-3.5 max-w-[520px] font-display text-[0.95rem] italic leading-relaxed text-text-dim">
          descubra o significado dos símbolos e forme a sua tradução
        </p>
      </header>

      <Translator />
    </main>
  );
}