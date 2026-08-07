import fs from 'fs/promises';
import path from 'path';

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

const DATA_FILE = path.join(
  process.cwd(),
  'data',
  'streamers.json',
);

export async function getStreamers(): Promise<Streamer[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export async function saveStreamers(
  streamers: Streamer[],
): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), {
    recursive: true,
  });

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(streamers, null, 2),
    'utf8',
  );
}