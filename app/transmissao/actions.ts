'use server';

import {
  redirect,
} from 'next/navigation';

import {
  auth,
} from '@/auth';

import {
  createTransmissionRoom,
  validateTransmissionRoom,
} from '@/lib/transmission';

import {
  createTransmissionSession,
} from '@/lib/transmission-session';

type DiscordSessionUser = {
  name?: string | null;
  image?: string | null;
  discordId?: string;
};

function cleanPassword(
  value: FormDataEntryValue | null,
) {
  return (
    value
      ?.toString()
      .trim()
      .slice(
        0,
        64,
      ) ?? ''
  );
}

async function getDiscordUser() {
  const session =
    await auth();

  const user =
    session?.user as
      | DiscordSessionUser
      | undefined;

  if (
    !user?.discordId
  ) {
    redirect(
      '/transmissao/login',
    );
  }

  return {
    discordId:
      user.discordId,

    name:
      user.name
        ?.trim()
        .slice(
          0,
          64,
        ) ||
      'Usuário',

    image:
      user.image ??
      null,
  };
}

export async function createRoomAction(
  formData: FormData,
) {
  const user =
    await getDiscordUser();

  const password =
    cleanPassword(
      formData.get(
        'password',
      ),
    );

  if (
    password.length < 4
  ) {
    redirect(
      '/transmissao?erro=dados',
    );
  }

  const room =
    await createTransmissionRoom({
      ownerName:
        user.name,

      password,
    });

  await createTransmissionSession({
    roomCode:
      room.code,

    name:
      user.name,

    discordId:
      user.discordId,

    image:
      user.image,

    isOwner:
      true,
  });

  redirect(
    `/transmissao/${room.code}`,
  );
}

export async function joinRoomAction(
  formData: FormData,
) {
  const user =
    await getDiscordUser();

  const code =
    formData
      .get('code')
      ?.toString()
      .trim()
      .toUpperCase() ??
    '';

  const password =
    cleanPassword(
      formData.get(
        'password',
      ),
    );

  if (
    !code ||
    !password
  ) {
    redirect(
      '/transmissao?erro=dados',
    );
  }

  const result =
    await validateTransmissionRoom({
      code,
      password,
    });

  if (
    !result.success
  ) {
    redirect(
      '/transmissao?erro=sala',
    );
  }

  await createTransmissionSession({
    roomCode:
      result.room.code,

    name:
      user.name,

    discordId:
      user.discordId,

    image:
      user.image,

    isOwner:
      false,
  });

  redirect(
    `/transmissao/${result.room.code}`,
  );
}