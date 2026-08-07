import fs from 'fs/promises';
import path from 'path';

export type Supporter = {
  id: string;
  name: string;
  createdAt: string;
};

export type SupportData = {
  progress: number;
  supportUrl: string;
  supporters: Supporter[];
};

const DATA_FILE = path.join(
  process.cwd(),
  'data',
  'support.json',
);

const DEFAULT_DATA: SupportData = {
  progress: 0,
  supportUrl: '',
  supporters: [],
};

export async function getSupportData(): Promise<SupportData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      progress:
        typeof parsed.progress === 'number'
          ? Math.min(100, Math.max(0, parsed.progress))
          : 0,

      supportUrl:
        typeof parsed.supportUrl === 'string'
          ? parsed.supportUrl
          : '',

      supporters: Array.isArray(parsed.supporters)
        ? parsed.supporters
        : [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveSupportData(
  data: SupportData,
): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), {
    recursive: true,
  });

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    'utf8',
  );
}