'use client';

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let client:
  | SupabaseClient
  | null = null;

let currentUrl = '';
let currentKey = '';

export function getSupabaseBrowser(
  url: string,
  anonKey: string,
) {
  if (!url) {
    throw new Error(
      'URL do Supabase não foi fornecida.',
    );
  }

  if (!anonKey) {
    throw new Error(
      'Chave pública do Supabase não foi fornecida.',
    );
  }

  /*
   * Reutiliza o mesmo cliente
   * enquanto as configurações
   * forem as mesmas.
   */
  if (
    client &&
    currentUrl === url &&
    currentKey === anonKey
  ) {
    return client;
  }

  currentUrl = url;
  currentKey = anonKey;

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