import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não está definida no ambiente.',
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não está definida no ambiente.',
    );
  }

  client = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return client;
}