'use client';

import { ALPHABET_LETTERS } from '@/lib/alphabet';

type VirtualKeyboardProps = {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
};

export default function VirtualKeyboard({ onKey, onBackspace, onClear }: VirtualKeyboardProps) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
        {ALPHABET_LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => onKey(letter)}
            className="flex h-14 flex-col items-center justify-center rounded-xl border border-line-soft bg-bg-deep/50 transition hover:-translate-y-0.5 hover:border-accent-hot hover:bg-accent-hot/10"
          >
            <span className="font-custom text-xl leading-none text-text-main">{letter}</span>
            <span className="mt-1 text-[0.62rem] font-bold uppercase leading-none text-text-dim">{letter}</span>
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2.5">
        <button
          type="button"
          onClick={() => onKey(' ')}
          className="flex-1 rounded-xl border border-line-soft bg-accent-hot/5 px-4 py-2.5 text-[0.75rem] font-bold uppercase tracking-wider text-text-main transition hover:border-accent-hot hover:text-accent-hot"
        >
          espaço
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="rounded-xl border border-line-soft px-4 py-2.5 text-[0.75rem] font-bold uppercase tracking-wider text-text-main transition hover:border-accent-hot hover:text-accent-hot"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-line-soft px-4 py-2.5 text-[0.75rem] font-bold uppercase tracking-wider text-text-main transition hover:border-accent-hot hover:text-accent-hot"
        >
          limpar
        </button>
      </div>
    </div>
  );
}
