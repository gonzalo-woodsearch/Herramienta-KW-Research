/**
 * Tipos base compartidos en todo el proyecto
 */

export interface Keyword {
  keyword: string;
  normalizedKeyword: string;

  // Datos de Ahrefs
  position?: number;
  traffic?: number;
  ahrefsVolume?: number;
  url: string;

  // Datos de Google Ads
  avgMonthlySearches?: number;
  competition?: 'LOW' | 'MEDIUM' | 'HIGH';
  cpcMicros?: number;

  // Keyword Difficulty (opcional, de Ahrefs Keywords Explorer)
  keywordDifficulty?: number;

  // Clustering
  treatment?: string | null;
  hasLocalIntent?: boolean;
  localLevel?: string;
  city?: string;
  neighborhood?: string;
  region?: string;
  localScore?: number;
  hasCommercialIntent?: boolean;
  commercialSignals?: string[];
  intentType?: string;

  // Scoring
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  volume: number;
  cpc: number;
  kd: number;
  competition: number;
  boosts: number;
  total: number;
}

export interface ClusteredKeywords {
  treatment: string;
  keywords: Keyword[];
  count: number;
  avgScore: number;
  totalVolume: number;
  topKeywords: Keyword[];
}

export interface ReportMetadata {
  url: string;
  country: string;
  language: string;
  timestamp: string;
  totalKeywords: number;
  processingTime?: number;
}

export interface AnalysisResult {
  metadata: ReportMetadata;
  keywords: Keyword[];
  clusters: ClusteredKeywords[];
}

export interface UrlCommandOptions {
  url: string;
  country: string;
  lang: string;
  limit: number;
  out: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokens: number;
  lastRefill: number;
}
