'use client';

import {
  usePathname,
} from 'next/navigation';

import GlobalPlayer from '@/components/GlobalPlayer';
import SideMenu from '@/components/SideMenu';

type AppChromeProps = {
  songs: React.ComponentProps<
    typeof GlobalPlayer
  >['songs'];
};

export default function AppChrome({
  songs,
}: AppChromeProps) {
  const pathname =
    usePathname();

  const isTransmission =
    pathname.startsWith(
      '/transmissao',
    );

  /*
   * A área de transmissão funciona
   * como uma aplicação independente.
   *
   * Não mostramos:
   * - menu principal
   * - player global
   */
  if (isTransmission) {
    return null;
  }

  return (
    <>
      <SideMenu />

      <GlobalPlayer
        songs={songs}
      />
    </>
  );
}