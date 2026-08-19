import {
  createHmac,
  timingSafeEqual,
} from 'crypto';

import {
  cookies,
} from 'next/headers';

const COOKIE_NAME =
  'grudge_transmission_session';

const SESSION_DURATION_MS =
  1000 * 60 * 60 * 12;

export type TransmissionSessionPayload = {
  roomCode: string;
  name: string;
  discordId: string;
  image: string | null;
  isOwner: boolean;
  expiresAt: number;
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'AUTH_SECRET não está configurado.',
    );
  }

  return secret;
}

function encodePayload(
  payload: TransmissionSessionPayload,
) {
  return Buffer.from(
    JSON.stringify(payload),
    'utf8',
  ).toString('base64url');
}

function decodePayload(
  value: string,
): TransmissionSessionPayload | null {
  try {
    const json =
      Buffer.from(
        value,
        'base64url',
      ).toString('utf8');

    const parsed =
      JSON.parse(
        json,
      ) as TransmissionSessionPayload;

    if (
      !parsed ||
      typeof parsed.roomCode !==
        'string' ||
      typeof parsed.name !==
        'string' ||
      typeof parsed.discordId !==
        'string' ||
      !(
        typeof parsed.image ===
          'string' ||
        parsed.image === null
      ) ||
      typeof parsed.isOwner !==
        'boolean' ||
      typeof parsed.expiresAt !==
        'number'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function sign(
  encodedPayload: string,
) {
  return createHmac(
    'sha256',
    getSecret(),
  )
    .update(encodedPayload)
    .digest('base64url');
}

function safeCompare(
  first: string,
  second: string,
) {
  const firstBuffer =
    Buffer.from(first);

  const secondBuffer =
    Buffer.from(second);

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer,
  );
}

export async function createTransmissionSession({
  roomCode,
  name,
  discordId,
  image,
  isOwner,
}: {
  roomCode: string;
  name: string;
  discordId: string;
  image?: string | null;
  isOwner: boolean;
}) {
  const expiresAt =
    Date.now() +
    SESSION_DURATION_MS;

  const payload: TransmissionSessionPayload =
    {
      roomCode:
        roomCode
          .trim()
          .toUpperCase(),

      name:
        name
          .trim()
          .slice(0, 64) ||
        'Usuário',

      discordId:
        discordId.trim(),

      image:
        typeof image ===
        'string'
          ? image
          : null,

      isOwner,

      expiresAt,
    };

  const encodedPayload =
    encodePayload(payload);

  const signature =
    sign(encodedPayload);

  const token =
    `${encodedPayload}.${signature}`;

  const cookieStore =
    await cookies();

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'lax',

      path: '/',

      expires:
        new Date(expiresAt),
    },
  );
}

export async function getTransmissionSession(
  expectedRoomCode?: string,
): Promise<TransmissionSessionPayload | null> {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      COOKIE_NAME,
    )?.value;

  if (!token) {
    return null;
  }

  const [
    encodedPayload,
    signature,
  ] = token.split('.');

  if (
    !encodedPayload ||
    !signature
  ) {
    return null;
  }

  const expectedSignature =
    sign(encodedPayload);

  if (
    !safeCompare(
      signature,
      expectedSignature,
    )
  ) {
    return null;
  }

  const payload =
    decodePayload(
      encodedPayload,
    );

  if (!payload) {
    return null;
  }

  if (
    payload.expiresAt <
    Date.now()
  ) {
    return null;
  }

  if (
    expectedRoomCode &&
    payload.roomCode !==
      expectedRoomCode
        .trim()
        .toUpperCase()
  ) {
    return null;
  }

  return payload;
}

export async function clearTransmissionSession() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    COOKIE_NAME,
  );
}