import type { Chat, CompareChat } from '../types';

const CHATS_KEY = 'berean_chats';
const COMPARE_CHATS_KEY = 'berean_compare_chats';
const API_KEY_KEY = 'berean_api_key';

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function loadCompareChats(): CompareChat[] {
  try {
    const raw = localStorage.getItem(COMPARE_CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCompareChats(chats: CompareChat[]): void {
  localStorage.setItem(COMPARE_CHATS_KEY, JSON.stringify(chats));
}

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

export function exportChat(chat: Chat): string {
  const lines: string[] = [
    `# ${chat.title}`,
    `**Theologian:** ${chat.theologianId}`,
    `**Date:** ${new Date(chat.createdAt).toLocaleDateString()}`,
    '',
    '---',
    '',
  ];

  for (const msg of chat.messages) {
    if (msg.role === 'user') {
      lines.push(`**You:** ${msg.content}`, '');
    } else {
      lines.push(`**Response:** ${msg.content}`, '');
    }

    if (msg.originalLanguage?.length) {
      lines.push('*Original Language Notes:*');
      for (const note of msg.originalLanguage) {
        lines.push(
          `- **${note.word}** — ${note.language === 'hebrew' ? 'Hebrew' : 'Greek'}: *${note.original}* (${note.transliteration}) — ${note.meaning}`
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function exportCompareChat(chat: CompareChat): string {
  const lines: string[] = [
    `# ${chat.title}`,
    `**Question:** ${chat.question}`,
    `**Date:** ${new Date(chat.createdAt).toLocaleDateString()}`,
    '',
    '---',
    '',
  ];

  for (const theologianId of chat.theologianIds) {
    const msgs = chat.responses[theologianId] || [];
    lines.push(`## ${theologianId}`, '');
    for (const msg of msgs) {
      if (msg.role === 'assistant') {
        lines.push(msg.content, '');
      }
    }
    lines.push('---', '');
  }

  return lines.join('\n');
}
