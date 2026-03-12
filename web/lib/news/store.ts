import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TelegramStore, NewsReport } from './types';

// On Vercel (serverless), use /tmp which is writable.
// Locally, use web/data/ which persists between runs.
const IS_VERCEL = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
const DATA_DIR = IS_VERCEL ? '/tmp/kw-news-data' : join(process.cwd(), 'data');

// In-memory cache — survives multiple requests to the same warm Lambda instance
let memReport: NewsReport | null = null;
let memTelegram: TelegramStore | null = null;

function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

const TELEGRAM_FILE = join(DATA_DIR, 'telegram-messages.json');
const REPORT_FILE   = join(DATA_DIR, 'news-report.json');

const DEFAULT_STORE: TelegramStore = {
  group1: { name: 'Grupo SEO Local 1', chatId: '', messages: [] },
  group2: { name: 'Grupo SEO Local 2', chatId: '', messages: [] },
};

// ─── Telegram Store ──────────────────────────────────────────────────────────

export function loadTelegramStore(): TelegramStore {
  if (memTelegram) return memTelegram;
  ensureDataDir();
  try {
    if (existsSync(TELEGRAM_FILE)) {
      const parsed = JSON.parse(readFileSync(TELEGRAM_FILE, 'utf-8')) as TelegramStore;
      memTelegram = parsed;
      return parsed;
    }
  } catch { /* fall through */ }
  memTelegram = JSON.parse(JSON.stringify(DEFAULT_STORE));
  return memTelegram!;
}

export function saveTelegramStore(store: TelegramStore): void {
  memTelegram = store;
  ensureDataDir();
  try {
    writeFileSync(TELEGRAM_FILE, JSON.stringify(store, null, 2));
  } catch { /* on read-only fs, memory cache is enough */ }
}

// ─── Report ──────────────────────────────────────────────────────────────────

export function loadReport(): NewsReport | null {
  if (memReport) return memReport;
  ensureDataDir();
  try {
    if (existsSync(REPORT_FILE)) {
      const parsed = JSON.parse(readFileSync(REPORT_FILE, 'utf-8')) as NewsReport;
      memReport = parsed;
      return parsed;
    }
  } catch { /* fall through */ }
  return null;
}

export function saveReport(report: NewsReport): void {
  memReport = report;
  ensureDataDir();
  try {
    writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  } catch { /* memory cache is enough if filesystem fails */ }
}
