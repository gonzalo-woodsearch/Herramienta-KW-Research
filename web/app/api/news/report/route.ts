import { NextRequest, NextResponse } from 'next/server';
import { fetchCategory } from '@/lib/news/rss';
import { loadTelegramStore, saveReport, loadReport } from '@/lib/news/store';
import { NewsReport, SectionData, TelegramSectionData, NewsItem, TelegramMessage } from '@/lib/news/types';

const HAS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY;

// Lazy client — only instantiated when API key is present
function getClient() {
  if (!HAS_ANTHROPIC) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Summarize a list of news items with Claude ─────────────────────────────

async function summarizeNews(items: NewsItem[], topic: string): Promise<string> {
  if (items.length === 0) {
    return `No se encontraron noticias recientes sobre ${topic}.`;
  }

  // Without API key — return a clean headline list
  if (!HAS_ANTHROPIC) {
    return items.slice(0, 5).map(i => `• ${i.title} — ${i.source}`).join('\n');
  }

  const digest = items.slice(0, 8).map((item, i) =>
    `${i + 1}. [${item.source}] ${item.title}\n   ${item.description.substring(0, 200)}`
  ).join('\n\n');

  try {
    const client = getClient()!;
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Eres un experto en ${topic}. Analiza estas noticias de la semana y genera un resumen ejecutivo en español de 3-5 puntos clave. Sé conciso y enfocado en lo más relevante para profesionales del SEO local y el marketing digital en España.

NOTICIAS:
${digest}

Responde con bullet points (•) empezando directamente con los puntos clave, sin introducción.`,
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return text;
  } catch {
    return items.slice(0, 3).map(i => `• ${i.title} (${i.source})`).join('\n');
  }
}

// ─── Summarize Telegram messages ─────────────────────────────────────────────

async function summarizeTelegram(messages: TelegramMessage[], groupName: string): Promise<string> {
  if (messages.length === 0) {
    return `Aún no hay mensajes de ${groupName}. Configura el bot de Telegram para recibir mensajes automáticamente.`;
  }

  // Take last 7 days of messages, max 50
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = messages
    .filter(m => new Date(m.date).getTime() > weekAgo)
    .slice(-50);

  if (recent.length === 0) {
    return `No hay mensajes nuevos de ${groupName} en los últimos 7 días.`;
  }

  const digest = recent
    .map(m => `[${new Date(m.date).toLocaleDateString('es-ES')}] ${m.sender}: ${m.text.substring(0, 300)}`)
    .join('\n---\n');

  // Without API key — return raw messages preview
  if (!HAS_ANTHROPIC) {
    return recent.slice(0, 5).map(m => `• [${m.sender}]: ${m.text.substring(0, 150)}`).join('\n');
  }

  try {
    const client = getClient()!;
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Eres un experto en SEO local. Analiza estos mensajes del grupo de Telegram "${groupName}" de esta semana y genera un resumen ejecutivo en español. Identifica: tendencias principales, recursos o herramientas compartidas, preguntas frecuentes del grupo, y consejos prácticos mencionados.

MENSAJES:
${digest}

Responde con secciones claras usando bullet points (•). Empieza directamente con el resumen.`,
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return text;
  } catch {
    return `${recent.length} mensajes procesados de ${groupName}. Configura ANTHROPIC_API_KEY para obtener resúmenes automáticos.`;
  }
}

// ─── Build section data ───────────────────────────────────────────────────────

async function buildSection(categoryId: string, topic: string, limit = 10): Promise<SectionData> {
  const items = await fetchCategory(categoryId, limit);
  const summary = await summarizeNews(items, topic);
  return { items, summary, lastUpdated: new Date().toISOString() };
}

// ─── GET: Return cached report ────────────────────────────────────────────────

export async function GET() {
  const report = loadReport();
  if (!report) {
    return NextResponse.json({ report: null, message: 'No hay reporte generado aún. Haz clic en "Generar Reporte".' });
  }
  return NextResponse.json({ report });
}

// ─── POST: Generate new report ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const forceRefresh = body.force === true;

  // Check if we have a recent report (less than 6 hours old) and no force
  if (!forceRefresh) {
    const cached = loadReport();
    if (cached) {
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < 6 * 60 * 60 * 1000) {
        return NextResponse.json({ report: cached, cached: true });
      }
    }
  }

  // Calculate week boundaries
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch all RSS categories in parallel
  const [iaGeneral, iaMarketing, iaTools, iaSeoLocal, seoGeneral, seoGoogle] = await Promise.all([
    buildSection('ia-general', 'inteligencia artificial'),
    buildSection('ia-marketing', 'IA aplicada al marketing digital'),
    buildSection('ia-tools', 'herramientas de inteligencia artificial'),
    buildSection('ia-seo-local', 'IA aplicada al SEO local'),
    buildSection('seo-general', 'SEO local'),
    buildSection('seo-google', 'actualizaciones de Google'),
  ]);

  // Telegram sections
  const telegramStore = loadTelegramStore();

  const [tg1Summary, tg2Summary] = await Promise.all([
    summarizeTelegram(telegramStore.group1.messages, telegramStore.group1.name),
    summarizeTelegram(telegramStore.group2.messages, telegramStore.group2.name),
  ]);

  const telegram1: TelegramSectionData = {
    messages: telegramStore.group1.messages.slice(-20),
    summary: tg1Summary,
    groupName: telegramStore.group1.name,
    lastUpdated: new Date().toISOString(),
  };

  const telegram2: TelegramSectionData = {
    messages: telegramStore.group2.messages.slice(-20),
    summary: tg2Summary,
    groupName: telegramStore.group2.name,
    lastUpdated: new Date().toISOString(),
  };

  const report: NewsReport = {
    generatedAt: new Date().toISOString(),
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    ia: {
      general: iaGeneral,
      marketing: iaMarketing,
      tools: iaTools,
      seoLocal: iaSeoLocal,
    },
    seoLocal: {
      general: seoGeneral,
      google: seoGoogle,
      telegram1,
      telegram2,
    },
  };

  saveReport(report);
  return NextResponse.json({ report, cached: false });
}

export const maxDuration = 60;
