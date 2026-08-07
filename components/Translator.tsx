'use client';

import { useState } from 'react';
import { ALPHABET_LETTERS } from '@/lib/alphabet';

export default function Translator() {
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  function selectLetter(letter: string) {
    setResult((current) => current + letter);
    setCopied(false);
  }

  function addSpace() {
    setResult((current) => current + ' ');
    setCopied(false);
  }

  function backspace() {
    setResult((current) => current.slice(0, -1));
    setCopied(false);
  }

  function clearResult() {
    setResult('');
    setCopied(false);
  }

  async function copyResult() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      console.warn('Não foi possível copiar o resultado.');
    }
  }

  return (
    <section
      aria-label="Teclado do alfabeto oculto"
      className="rounded-[22px] border border-line-soft bg-bg-mid/30 p-5 backdrop-blur-sm sm:p-7"
    >
      <div className="rounded-[18px] border border-line-soft bg-bg-deep/45 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-text-dim">
            resultado traduzido
          </p>

          <span className="text-[0.68rem] text-text-dim">
            {result.length} caracteres
          </span>
        </div>

        <div
          aria-live="polite"
          className="mt-3 min-h-[92px] whitespace-pre-wrap break-words rounded-xl border border-line-soft bg-bg-deep/45 p-4 text-left font-body text-[1.05rem] leading-relaxed text-text-main"
        >
          {result || (
            <span className="text-text-dim">
              Clique nos símbolos abaixo para formar a tradução...
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addSpace}
            className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-main transition hover:border-accent-hot hover:text-accent-hot"
          >
            adicionar espaço
          </button>

          <button
            type="button"
            onClick={backspace}
            disabled={!result}
            className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-main transition hover:border-accent-hot hover:text-accent-hot disabled:cursor-not-allowed disabled:opacity-35"
          >
            apagar última
          </button>

          <button
            type="button"
            onClick={clearResult}
            disabled={!result}
            className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-main transition hover:border-accent-hot hover:text-accent-hot disabled:cursor-not-allowed disabled:opacity-35"
          >
            limpar
          </button>

          <button
            type="button"
            onClick={copyResult}
            disabled={!result}
            className="ml-auto rounded-xl bg-accent-hot px-4 py-2 text-[0.78rem] font-bold text-bg-deep transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {copied ? 'copiado!' : 'copiar resultado'}
          </button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-5 gap-2 sm:grid-cols-7 sm:gap-3 md:grid-cols-9">
        {ALPHABET_LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => selectLetter(letter)}
            aria-label="Adicionar símbolo ao resultado"
            className="group flex aspect-square min-h-12 items-center justify-center rounded-xl border border-line-soft bg-bg-deep/40 text-text-main transition duration-200 hover:-translate-y-0.5 hover:border-accent-hot hover:bg-accent-hot/10 hover:text-accent-soft hover:shadow-[0_0_20px_rgba(255,61,129,0.16)] active:translate-y-0 active:scale-95"
          >
            <span className="font-custom text-[1.7rem] sm:text-[2rem]">
              {letter}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}