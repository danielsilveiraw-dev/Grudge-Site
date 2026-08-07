'use client';

import { usePathname } from 'next/navigation';
import Player from '@/components/Player';
import type { Song } from '@/lib/music';

type GlobalPlayerProps = {
  songs: Song[];
};

export default function GlobalPlayer({ songs }: GlobalPlayerProps) {
  const pathname = usePathname();

  // Na página inicial o player será colocado dentro do próprio conteúdo.
  if (pathname === '/') {
    return null;
  }

  return <Player songs={songs} />;
}