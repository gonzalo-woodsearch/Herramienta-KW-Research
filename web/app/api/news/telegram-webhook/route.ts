import { NextRequest, NextResponse } from 'next/server';
import { loadTelegramStore, saveTelegramStore } from '@/lib/news/store';
import { TelegramMessage } from '@/lib/news/types';

// ─── Telegram Bot Webhook ──────────────────────────────────────────────────
// Set your webhook URL in Telegram to: https://yourapp.com/api/news/telegram-webhook
// The bot must be an admin member of both groups.
// Messages are stored locally and summarized on demand.

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { first_name?: string; last_name?: string; username?: string };
    chat: { id: number; title?: string; type: string };
    text?: string;
    date: number;
  };
}

export async function POST(req: NextRequest) {
  // Verify secret token
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedToken && secretToken !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const group1ChatId = process.env.TELEGRAM_GROUP1_ID || '';
  const group2ChatId = process.env.TELEGRAM_GROUP2_ID || '';

  // Only process messages from configured groups
  if (chatId !== group1ChatId && chatId !== group2ChatId) {
    return NextResponse.json({ ok: true });
  }

  const store = loadTelegramStore();
  const tgMessage: TelegramMessage = {
    id: message.message_id,
    text: message.text,
    date: new Date(message.date * 1000).toISOString(),
    sender: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') ||
            message.from?.username || 'Anónimo',
    groupId: chatId,
    groupName: message.chat.title || chatId,
  };

  if (chatId === group1ChatId) {
    // Update group name if available
    if (message.chat.title) store.group1.name = message.chat.title;
    store.group1.chatId = chatId;

    // Deduplicate by message ID
    const exists = store.group1.messages.some(m => m.id === tgMessage.id);
    if (!exists) {
      store.group1.messages.push(tgMessage);
      // Keep only last 500 messages
      if (store.group1.messages.length > 500) {
        store.group1.messages = store.group1.messages.slice(-500);
      }
    }
  } else if (chatId === group2ChatId) {
    if (message.chat.title) store.group2.name = message.chat.title;
    store.group2.chatId = chatId;

    const exists = store.group2.messages.some(m => m.id === tgMessage.id);
    if (!exists) {
      store.group2.messages.push(tgMessage);
      if (store.group2.messages.length > 500) {
        store.group2.messages = store.group2.messages.slice(-500);
      }
    }
  }

  saveTelegramStore(store);
  return NextResponse.json({ ok: true });
}

// ─── GET: Return current Telegram store info ──────────────────────────────

export async function GET() {
  const store = loadTelegramStore();
  return NextResponse.json({
    group1: {
      name: store.group1.name,
      chatId: store.group1.chatId,
      messageCount: store.group1.messages.length,
      lastMessage: store.group1.messages[store.group1.messages.length - 1]?.date || null,
    },
    group2: {
      name: store.group2.name,
      chatId: store.group2.chatId,
      messageCount: store.group2.messages.length,
      lastMessage: store.group2.messages[store.group2.messages.length - 1]?.date || null,
    },
  });
}

// ─── PUT: Manual message import (paste from Telegram) ────────────────────────

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.group || !body.messages) {
    return NextResponse.json({ error: 'Invalid body. Needs { group: 1|2, messages: string }' }, { status: 400 });
  }

  const store = loadTelegramStore();
  const groupKey = body.group === 1 ? 'group1' : 'group2';

  // Parse pasted text as individual messages by line
  const lines = String(body.messages).split('\n').filter(l => l.trim().length > 10);
  const newMessages: TelegramMessage[] = lines.map((text, i) => ({
    id: Date.now() + i,
    text: text.trim(),
    date: new Date().toISOString(),
    sender: 'Import manual',
    groupId: store[groupKey].chatId || `group${body.group}`,
    groupName: store[groupKey].name,
  }));

  store[groupKey].messages.push(...newMessages);
  if (store[groupKey].messages.length > 500) {
    store[groupKey].messages = store[groupKey].messages.slice(-500);
  }

  saveTelegramStore(store);
  return NextResponse.json({ ok: true, added: newMessages.length });
}
