import {
  redirect,
} from 'next/navigation';

import TransmissionRoomClient from '@/components/transmission/TransmissionRoomClient';

import {
  getTransmissionSession,
} from '@/lib/transmission-session';

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
      `/transmissao?erro=acesso`,
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
    />
  );
}