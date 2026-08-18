import {
  redirect,
} from 'next/navigation';

import TransmissionRoomClient from '@/components/transmission/TransmissionRoomClient';

import {
  getTransmissionSession,
} from '@/lib/transmission-session';

export const dynamic =
  'force-dynamic';

export const revalidate =
  0;

type RoomPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function TransmissionRoomPage({
  params,
}: RoomPageProps) {
  const {
    code,
  } = await params;

  const normalizedCode =
    code
      .trim()
      .toUpperCase();

  const session =
    await getTransmissionSession(
      normalizedCode,
    );

  if (!session) {
    redirect(
      '/transmissao?erro=acesso',
    );
  }

  /*
   * Lemos as variáveis NO SERVIDOR.
   *
   * Mantemos compatibilidade com
   * NEXT_PUBLIC_SUPABASE_URI,
   * que já é usada pelo projeto.
   */
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URI;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'URL do Supabase não está configurada no servidor.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Chave pública do Supabase não está configurada no servidor.',
    );
  }

  return (
    <TransmissionRoomClient
      code={
        normalizedCode
      }
      name={
        session.name
      }
      isOwner={
        session.isOwner
      }
      supabaseUrl={
        supabaseUrl
      }
      supabaseAnonKey={
        supabaseAnonKey
      }
    />
  );
}