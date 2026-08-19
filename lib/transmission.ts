import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';

import {
  getSupabaseServer,
} from '@/lib/supabase-server';

export type TransmissionRoom = {
  id: string;
  code: string;
  ownerName: string;
  createdAt: string;
  expiresAt: string;
};

const ROOM_CODE_LENGTH =
  6;

const ROOM_CHARACTERS =
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';

  for (
    let index = 0;
    index <
    ROOM_CODE_LENGTH;
    index++
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          ROOM_CHARACTERS.length,
      );

    code +=
      ROOM_CHARACTERS[
        randomIndex
      ];
  }

  return code;
}

function hashPassword(
  password: string,
) {
  const salt =
    randomBytes(
      16,
    ).toString('hex');

  const hash =
    scryptSync(
      password,
      salt,
      64,
    ).toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(
  password: string,
  storedValue: string,
) {
  const [
    salt,
    storedHash,
  ] = storedValue.split(':');

  if (
    !salt ||
    !storedHash
  ) {
    return false;
  }

  const calculatedHash =
    scryptSync(
      password,
      salt,
      64,
    );

  const expectedHash =
    Buffer.from(
      storedHash,
      'hex',
    );

  if (
    calculatedHash.length !==
    expectedHash.length
  ) {
    return false;
  }

  return timingSafeEqual(
    calculatedHash,
    expectedHash,
  );
}

async function getUniqueRoomCode() {
  const supabase =
    getSupabaseServer();

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const code =
      generateRoomCode();

    const {
      data,
      error,
    } = await supabase
      .from(
        'transmission_rooms',
      )
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error(
    'Não foi possível gerar um código de sala.',
  );
}

export async function createTransmissionRoom({
  ownerName,
  password,
}: {
  ownerName: string;
  password: string;
}): Promise<TransmissionRoom> {
  const supabase =
    getSupabaseServer();

  const code =
    await getUniqueRoomCode();

  const now =
    new Date();

  const expiresAt =
    new Date(
      now.getTime() +
        1000 *
          60 *
          60 *
          12,
    );

  const {
    data,
    error,
  } = await supabase
    .from(
      'transmission_rooms',
    )
    .insert({
      code,

      password_hash:
        hashPassword(
          password,
        ),

      owner_name:
        ownerName,

      expires_at:
        expiresAt.toISOString(),
    })
    .select(
      'id, code, owner_name, created_at, expires_at',
    )
    .single();

  if (
    error ||
    !data
  ) {
    console.error(
      'Erro ao criar sala:',
      error,
    );

    throw new Error(
      'Não foi possível criar a sala.',
    );
  }

  return {
    id:
      data.id,

    code:
      data.code,

    ownerName:
      data.owner_name,

    createdAt:
      data.created_at,

    expiresAt:
      data.expires_at,
  };
}

export async function validateTransmissionRoom({
  code,
  password,
}: {
  code: string;
  password: string;
}): Promise<
  | {
      success: true;
      room: TransmissionRoom;
    }
  | {
      success: false;
    }
> {
  const supabase =
    getSupabaseServer();

  const normalizedCode =
    code
      .trim()
      .toUpperCase();

  const {
    data,
    error,
  } = await supabase
    .from(
      'transmission_rooms',
    )
    .select(
      'id, code, password_hash, owner_name, created_at, expires_at',
    )
    .eq(
      'code',
      normalizedCode,
    )
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    return {
      success: false,
    };
  }

  const expiresAt =
    new Date(
      data.expires_at,
    );

  if (
    expiresAt.getTime() <
    Date.now()
  ) {
    return {
      success: false,
    };
  }

  if (
    !verifyPassword(
      password,
      data.password_hash,
    )
  ) {
    return {
      success: false,
    };
  }

  return {
    success: true,

    room: {
      id:
        data.id,

      code:
        data.code,

      ownerName:
        data.owner_name,

      createdAt:
        data.created_at,

      expiresAt:
        data.expires_at,
    },
  };
}