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
      'URL do Supabase não está configurada.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Chave pública do Supabase não está configurada.',
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
      discordId={
        session.discordId
      }
      image={
        session.image
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