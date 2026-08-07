import fs from 'fs/promises';
import path from 'path';

export type Riddle = {
  id: string;
  title: string;
  clue: string;
  image?: string;
  buttonText?: string;
  url?: string;
  createdAt: string;
};

const DATA_FILE = path.join(
  process.cwd(),
  'data',
  'riddles.json',
);

export async function getRiddles(): Promise<Riddle[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((riddle) => ({
        id: String(riddle.id ?? ''),
        title: String(riddle.title ?? ''),
        clue: String(riddle.clue ?? ''),
        image:
          typeof riddle.image === 'string' && riddle.image
            ? riddle.image
            : undefined,
        buttonText:
          typeof riddle.buttonText === 'string' &&
          riddle.buttonText.trim()
            ? riddle.buttonText
            : undefined,
        url:
          typeof riddle.url === 'string' &&
          riddle.url.trim()
            ? riddle.url
            : undefined,
        createdAt:
          typeof riddle.createdAt === 'string'
            ? riddle.createdAt
            : new Date().toISOString(),
      }))
      .filter((riddle) => riddle.id && riddle.title)
      .sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
  } catch {
    return [];
  }
}

export async function saveRiddles(
  riddles: Riddle[],
): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), {
    recursive: true,
  });

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(riddles, null, 2),
    'utf8',
  );
}