'use client';

import {
  useEffect,
  useState,
} from 'react';

import { usePathname } from 'next/navigation';

import {
  ALPHABET_LETTERS,
} from '@/lib/alphabet';

type Ghost = {
  content: string;
  kind: 'symbol' | 'word';
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  peak: number;
  rotate: number;
};

const GHOST_WORDS = [
  'GRUDGE',
  'FLUXO',
  'COSMOS',
  'SEGREDO',
  'CAOS',
  'FENDAS',
  'AGNES',
  'LUCA',
  '2 TEMPORADA',
  'DILUIÇÃO',
  'ETER',
  'SACRIFÍCIO',
  'SANGUE',
  'FOGO',
  'DEMENTAÇÃO',
  'DESTINO',
  'FRAGMENTOS',
  'ECO',
  'MEMÓRIAS',
  'VAZIO',
  'RUPTURA',
  'CICLO',
  'ASCENSÃO',
  'QUEDA',
  'ORIGEM',
] as const;

function randomItem<T>(
  items: readonly T[],
): T {
  return items[
    Math.floor(
      Math.random() *
        items.length,
    )
  ];
}

function generateSymbols(): Ghost[] {
  const isMobile =
    window.innerWidth < 640;

  const count =
    isMobile ? 20 : 38;

  return Array.from(
    {
      length: count,
    },
    () => ({
      content:
        randomItem(
          ALPHABET_LETTERS,
        ),

      kind:
        'symbol' as const,

      left:
        Math.random() * 96,

      top:
        Math.random() * 100,

      size:
        isMobile
          ? 20 +
            Math.random() * 38
          : 24 +
            Math.random() * 52,

      duration:
        7 +
        Math.random() * 8,

      delay:
        Math.random() * 8,

      peak:
        0.14 +
        Math.random() * 0.2,

      rotate:
        -18 +
        Math.random() * 36,
    }),
  );
}

function generateWords(): Ghost[] {
  const isMobile =
    window.innerWidth < 640;

  const guaranteedWords = [
    ...GHOST_WORDS,
  ];

  const extraCount =
    isMobile ? 3 : 14;

  const extraWords =
    Array.from(
      {
        length: extraCount,
      },
      () =>
        randomItem(
          GHOST_WORDS,
        ),
    );

  const words = [
    ...guaranteedWords,
    ...extraWords,
  ].sort(
    () =>
      Math.random() - 0.5,
  );

  return words.map(
    (word, index) => {
      let left: number;

      if (isMobile) {
        left =
          5 +
          Math.random() * 82;
      } else {
        const zone =
          index % 3;

        if (zone === 0) {
          // ESQUERDA
          left =
            4 +
            Math.random() * 24;
        } else if (
          zone === 1
        ) {
          // CENTRO
          left =
            35 +
            Math.random() * 25;
        } else {
          // DIREITA
          left =
            68 +
            Math.random() * 22;
        }
      }

      const top =
        isMobile
          ? 5 +
            Math.random() * 86
          : 5 +
            ((index * 17) % 80) +
            Math.random() * 7;

      return {
        content: word,

        kind:
          'word' as const,

        left,

        top,

        size:
          isMobile
            ? 11 +
              Math.random() * 7
            : 14 +
              Math.random() * 16,

        duration:
          9 +
          Math.random() * 10,

        delay:
          (index /
            words.length) *
            8 +
          Math.random() * 3,

        peak:
          0.1 +
          Math.random() * 0.13,

        rotate:
          -8 +
          Math.random() * 16,
      };
    },
  );
}

export default function GhostLetters() {
  const pathname =
    usePathname();

  const [
    ghosts,
    setGhosts,
  ] = useState<Ghost[]>([]);

  const isAdminPage =
    pathname.startsWith(
      '/admin',
    );

  const shouldShowSymbols =
    pathname === '/enigmas' ||
    pathname === '/alfabeto';

  useEffect(() => {
    if (isAdminPage) {
      setGhosts([]);
      return;
    }

    let resizeTimer:
      ReturnType<
        typeof setTimeout
      >;

    function createGhosts() {
      setGhosts(
        shouldShowSymbols
          ? generateSymbols()
          : generateWords(),
      );
    }

    function handleResize() {
      clearTimeout(
        resizeTimer,
      );

      resizeTimer =
        setTimeout(() => {
          createGhosts();
        }, 250);
    }

    createGhosts();

    window.addEventListener(
      'resize',
      handleResize,
    );

    return () => {
      clearTimeout(
        resizeTimer,
      );

      window.removeEventListener(
        'resize',
        handleResize,
      );
    };
  }, [
    isAdminPage,
    shouldShowSymbols,
  ]);

  if (isAdminPage) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,61,129,0.07),transparent_65%)]" />

      {ghosts.map(
        (
          ghost,
          index,
        ) => (
          <span
            key={`${ghost.kind}-${ghost.content}-${index}`}
            className={`absolute select-none opacity-0 motion-reduce:animate-none ${
              ghost.kind ===
              'symbol'
                ? 'font-custom text-accent-soft motion-reduce:opacity-20'
                : 'font-body font-bold uppercase tracking-[0.3em] text-accent-hot motion-reduce:opacity-10'
            }`}
            style={
              {
                left:
                  `${ghost.left}%`,

                top:
                  `${ghost.top}%`,

                fontSize:
                  `${ghost.size}px`,

                transform:
                  `rotate(${ghost.rotate}deg)`,

                animation:
                  `driftFade ${ghost.duration}s ease-in-out ${ghost.delay}s infinite`,

                textShadow:
                  ghost.kind ===
                  'symbol'
                    ? '0 0 24px rgba(242,166,198,0.32)'
                    : '0 0 28px rgba(255,61,129,0.28)',

                '--peak':
                  ghost.peak,
              } as React.CSSProperties
            }
          >
            {ghost.content}
          </span>
        ),
      )}
    </div>
  );
}