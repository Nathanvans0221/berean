export interface Theologian {
  id: string;
  name: string;
  shortName: string;
  years: string;
  tradition: string;
  avatar: string;
  color: string;
  description: string;
  keyWorks: string[];
  distinctives: string[];
  systemPrompt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  theologianId?: string;
  timestamp: number;
  scriptureRefs?: ScriptureRef[];
  originalLanguage?: OriginalLanguageNote[];
}

export interface ScriptureRef {
  reference: string;
  text: string;
}

export interface OriginalLanguageNote {
  word: string;
  original: string;
  language: 'hebrew' | 'greek';
  transliteration: string;
  meaning: string;
}

export interface Chat {
  id: string;
  title: string;
  theologianId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface CompareChat {
  id: string;
  title: string;
  question: string;
  theologianIds: string[];
  responses: Record<string, Message[]>;
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'chat' | 'compare' | 'scripture';

export interface AppState {
  currentView: ViewMode;
  activeChat: string | null;
  activeChatType: 'single' | 'compare';
  selectedTheologian: string;
  apiKey: string;
  chats: Chat[];
  compareChats: CompareChat[];
}
