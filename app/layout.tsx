import type {
  Metadata,
} from 'next';

import {
  Cormorant_Garamond,
  Manrope,
} from 'next/font/google';

import './globals.css';

import AppChrome from '@/components/AppChrome';
import GhostLetters from '@/components/GhostLetters';

import {
  getSongs,
} from '@/lib/music';

export const dynamic =
  'force-dynamic';

const display =
  Cormorant_Garamond({
    subsets: [
      'latin',
    ],

    weight: [
      '500',
      '600',
    ],

    style: [
      'normal',
      'italic',
    ],

    variable:
      '--font-display',
  });

const body =
  Manrope({
    subsets: [
      'latin',
    ],

    weight: [
      '400',
      '500',
      '700',
    ],

    variable:
      '--font-body',
  });

export const metadata:
  Metadata = {
  metadataBase:
    new URL(
      'https://grudge.com.br',
    ),

  title: {
    default:
      'GRUDGE SMP',

    template:
      '%s | GRUDGE SMP',
  },

  description:
    'Entre no caos. Descubra o desconhecido.',

  applicationName:
    'GRUDGE SMP',

  alternates: {
    canonical:
      '/',
  },

  openGraph: {
    type:
      'website',

    locale:
      'pt_BR',

    url:
      'https://grudge.com.br',

    siteName:
      'GRUDGE SMP',

    title:
      'GRUDGE SMP',

    description:
      'Entre no caos. Descubra o desconhecido.',

    images: [
      {
        url:
          '/assets/grudge-logo.png',

        width:
          1536,

        height:
          512,

        alt:
          'GRUDGE SMP',
      },
    ],
  },

  twitter: {
    card:
      'summary_large_image',

    title:
      'GRUDGE SMP',

    description:
      'Entre no caos. Descubra o desconhecido.',

    images: [
      '/assets/grudge-logo.png',
    ],
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
};

export default async function RootLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const songs =
    await getSongs();

  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable}`}
    >
      <body>
        <GhostLetters />

        <AppChrome
          songs={songs}
        />

        {children}
      </body>
    </html>
  );
}