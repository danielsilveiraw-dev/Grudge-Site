import { getSupabaseServer } from './supabase-server';

export type Streamer = {
  id: string;
  name: string;
  image: string;
  instagram?: string;
  discord?: string;
  tiktok?: string;
  youtube?: string;
  twitch?: string;
  kick?: string;
  x?: string;
  createdAt: string;
};

export async function getStreamers(): Promise<Streamer[]> {
  const { data, error } = await getSupabaseServer()
    .from('streamers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar streamers:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
    instagram: row.instagram,
    discord: row.discord,
    youtube: row.youtube,
    twitch: row.twitch,
    kick: row.kick,
    tiktok: row.tiktok,
    x: row.x,
    createdAt: row.created_at,
  }));
}