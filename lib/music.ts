import fs from 'fs/promises';
import path from 'path';

export const SITE_PAGES = [
  '/',
  '/alfabeto',
  '/calendario',
  '/enigmas',
] as const;

export type SitePage = (typeof SITE_PAGES)[number];

export type Song = {
  id: string;
  name: string;
  audio: string;
  cover?: string;
  pages: SitePage[];
  createdAt: string;
};

const DATA_FILE = path.join(process.cwd(), 'data', 'music.json');

export async function getSongs(): Promise<Song[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((song) => {
      const validPages = Array.isArray(song.pages)
        ? song.pages.filter((page: unknown): page is SitePage =>
            SITE_PAGES.includes(page as SitePage),
          )
        : [];

      return {
        ...song,
        pages: validPages.length > 0 ? validPages : ['/'],
      };
    });
  } catch {
    return [];
  }
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), {
    recursive: true,
  });

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(songs, null, 2),
    'utf8',
  );
}