export type IACategoryId = 'ia-general' | 'ia-marketing' | 'ia-tools' | 'ia-seo-local';
export type SEOCategoryId = 'seo-general' | 'seo-google' | 'telegram-1' | 'telegram-2';
export type CategoryId = IACategoryId | SEOCategoryId;

export interface NewsItem {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedAt: string;
}

export interface TelegramMessage {
  id: number;
  text: string;
  date: string;
  sender: string;
  groupId: string;
  groupName: string;
}

export interface SectionData {
  items: NewsItem[];
  summary: string;
  lastUpdated: string;
}

export interface TelegramSectionData {
  messages: TelegramMessage[];
  summary: string;
  groupName: string;
  lastUpdated: string;
}

export interface NewsReport {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  ia: {
    general: SectionData;
    marketing: SectionData;
    tools: SectionData;
    seoLocal: SectionData;
  };
  seoLocal: {
    general: SectionData;
    google: SectionData;
    telegram1: TelegramSectionData;
    telegram2: TelegramSectionData;
  };
}

export interface TelegramStore {
  group1: {
    name: string;
    chatId: string;
    messages: TelegramMessage[];
  };
  group2: {
    name: string;
    chatId: string;
    messages: TelegramMessage[];
  };
}
