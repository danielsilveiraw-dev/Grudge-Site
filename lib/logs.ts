import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type LogEntry = {
  id: string;
  timestamp: string; // ISO
  action: string;
  details?: string;
};

const LOG_FILE = path.join(process.cwd(), 'data', 'logs.json');
const MAX_LOGS = 300; // evita o arquivo crescer pra sempre

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    const logs: LogEntry[] = JSON.parse(raw);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export async function addLog(action: string, details?: string): Promise<void> {
  let logs: LogEntry[] = [];
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    logs = JSON.parse(raw);
  } catch {
    logs = [];
  }

  logs.push({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    details,
  });

  // mantém só os mais recentes
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(logs.length - MAX_LOGS);
  }

  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}
