import fs from 'fs/promises';
import path from 'path';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // formato AAAA-MM-DD
  description?: string;
  image?: string; // caminho público, ex: /uploads/events/xxxx.jpg
};

const DATA_FILE = path.join(process.cwd(), 'data', 'events.json');

export async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const events: CalendarEvent[] = JSON.parse(raw);
    return events.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
}
