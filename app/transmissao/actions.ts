'use server';

import {
  redirect,
} from 'next/navigation';

import {
  createTransmissionRoom,
  validateTransmissionRoom,
} from '@/lib/transmission';

import {
  createTransmissionSession,
} from '@/lib/transmission-session';

function cleanName(
  value: FormDataEntryValue | null,
) {
  return (
    value
      ?.toString()
      .trim()
      .slice(
        0,
        28,
      ) ?? ''
  );
}

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

export async function createRoomAction(
  formData: FormData,
) {
  const name =
    cleanName(
      formData.get(
        'name',
      ),
    );

  const password =
    cleanPassword(
      formData.get(
        'password',
      ),
    );

  if (
    name.length < 2 ||
    password.length < 4
  ) {
    redirect(
      '/transmissao?erro=dados',
    );
  }

  const room =
    await createTransmissionRoom({
      ownerName:
        name,

      password,
    });

  await createTransmissionSession({
    roomCode:
      room.code,

    name,

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
  const code =
    formData
      .get('code')
      ?.toString()
      .trim()
      .toUpperCase() ??
    '';

  const name =
    cleanName(
      formData.get(
        'name',
      ),
    );

  const password =
    cleanPassword(
      formData.get(
        'password',
      ),
    );

  if (
    !code ||
    name.length < 2 ||
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

    name,

    isOwner:
      false,
  });

  redirect(
    `/transmissao/${result.room.code}`,
  );
}