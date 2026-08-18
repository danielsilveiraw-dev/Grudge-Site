'use client';

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let client: SupabaseClient | null =
  null;

export function getSupabaseBrowser() {
  if (client) {
    return client;
  }

  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não está configurada.',
    );
  }

  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada.',
    );
  }

  client = createClient(
    url,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return client;
}