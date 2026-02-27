/**
 * DataForSEO Keywords Explorer
 * Uses DataForSEO Labs API: keyword_overview + keyword_suggestions
 */

import DataForSEOClient from '../dataforseo/client';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

const GEO_MAP: Record<string, { location_code: number; language_code: string }> = {
  ES: { location_code: 2724, language_code: 'es' },
  MX: { location_code: 2484, language_code: 'es' },
  AR: { location_code: 2032, language_code: 'es' },
  CO: { location_code: 2170, language_code: 'es' },
  US: { location_code: 2840, language_code: 'en' },
  GB: { location_code: 2826, language_code: 'en' },
  DE: { location_code: 2276, language_code: 'de' },
  FR: { location_code: 2250, language_code: 'fr' },
};

export type KwCategory = 'idea' | 'question' | 'comparison' | 'related';

export interface ExplorerKeyword {
  keyword: string;
  volume: number;
  cpcEur: number;
  difficulty: number;
  trafficPotential: number;
  category: KwCategory;
}

export interface SeedOverview {
  keyword: string;
  volume: number;
  cpcEur: number;
  difficulty: number;
  trafficPotential: number;
}

export interface ExplorerResult {
  seed: string;
  country: string;
  overview: SeedOverview | null;
  keywords: ExplorerKeyword[];
}

interface DfsKeywordInfo {
  search_volume?: number;
  cpc?: number;
  competition?: number;
  competition_level?: string;
}

interface DfsKeywordProperties {
  keyword_difficulty?: number;
}

interface DfsItem {
  keyword?: string;
  keyword_info?: DfsKeywordInfo;
  keyword_properties?: DfsKeywordProperties;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: any[];
  }>;
}

const QUESTION_PATTERN = /\?|\b(cómo|como|qué|que es|dónde|donde|cuándo|cuando|cuál|cual|quién|quien|cuánto|cuanto|por qué|porqué|para qué|para que)\b/i;
const COMPARISON_PATTERN = /\bvs\b|versus|\bmejor(es)?\b|\bdiferencia(s)?\b|\balternativa(s)?\b|\bcompar(ativa|ar|ación)\b|\bprecio(s)?\b|\bcoste?\b|\bcuánto cuesta\b|\bcuanto cuesta\b|\bbarato\b|\bbarata\b/i;

function categorize(keyword: string): KwCategory {
  if (QUESTION_PATTERN.test(keyword)) return 'question';
  if (COMPARISON_PATTERN.test(keyword)) return 'comparison';
  return 'idea';
}

function mapItem(item: DfsItem, defaultCat: KwCategory): ExplorerKeyword | null {
  if (!item.keyword) return null;
  const cat = categorize(item.keyword);
  const finalCat: KwCategory = (cat === 'question' || cat === 'comparison') ? cat : defaultCat;
  return {
    keyword: item.keyword,
    volume: item.keyword_info?.search_volume || 0,
    cpcEur: Math.round((item.keyword_info?.cpc || 0) * 10) / 10,
    difficulty: item.keyword_properties?.keyword_difficulty || 0,
    trafficPotential: 0,
    category: finalCat,
  };
}

// Extract items handling both DataForSEO Labs response structures
function extractItems(result: any[]): DfsItem[] {
  if (!result || !result[0]) return [];
  const r0 = result[0];
  // Structure: result[0].items (keyword_overview, keyword_suggestions)
  if (Array.isArray(r0.items)) return r0.items;
  // Fallback: result is flat array of keyword objects
  if (Array.isArray(result) && result[0]?.keyword) return result as DfsItem[];
  return [];
}

export class KeywordsExplorerService {
  private client: DataForSEOClient;

  constructor() {
    this.client = new DataForSEOClient();
  }

  private getGeo(country: string): { location_code: number; language_code: string } {
    return GEO_MAP[country.toUpperCase()] || GEO_MAP['ES'];
  }

  private async fetchOverview(seed: string, country: string): Promise<SeedOverview | null> {
    try {
      const geo = this.getGeo(country);
      const res = await this.client.post<DfsResponse>(
        '/dataforseo_labs/google/keyword_overview/live',
        [{ keywords: [seed], location_code: geo.location_code, language_code: geo.language_code }]
      );

      if (res.status_code !== 20000) {
        logger.warn(`keyword_overview status ${res.status_code}: ${res.status_message}`);
        return null;
      }

      const taskResult = res.tasks?.[0];
      if (!taskResult || taskResult.status_code !== 20000) return null;

      const items = extractItems(taskResult.result || []);
      const item = items.find((i: DfsItem) => i.keyword?.toLowerCase() === seed.toLowerCase()) || items[0];
      if (!item?.keyword) return null;

      return {
        keyword: item.keyword,
        volume: item.keyword_info?.search_volume || 0,
        cpcEur: Math.round((item.keyword_info?.cpc || 0) * 10) / 10,
        difficulty: item.keyword_properties?.keyword_difficulty || 0,
        trafficPotential: 0,
      };
    } catch (e: any) {
      logger.warn(`overview failed for "${seed}": ${e.message}`);
      return null;
    }
  }

  private async fetchSuggestions(seed: string, country: string, limit: number): Promise<DfsItem[]> {
    try {
      const geo = this.getGeo(country);
      const res = await this.client.post<DfsResponse>(
        '/dataforseo_labs/google/keyword_suggestions/live',
        [{
          keyword: seed,
          location_code: geo.location_code,
          language_code: geo.language_code,
          limit,
          order_by: ['keyword_info.search_volume,desc'],
        }]
      );

      if (res.status_code !== 20000) {
        logger.warn(`keyword_suggestions status ${res.status_code}: ${res.status_message}`);
        return [];
      }

      const taskResult = res.tasks?.[0];
      if (!taskResult || taskResult.status_code !== 20000) return [];

      return extractItems(taskResult.result || []);
    } catch (e: any) {
      logger.warn(`suggestions failed for "${seed}": ${e.message}`);
      return [];
    }
  }

  async explore(seed: string, country = 'ES', limit = 50): Promise<ExplorerResult> {
    const cacheKey = `dfs:explorer:${seed.toLowerCase().trim()}:${country}:${limit}`;
    const cached = cache.get<ExplorerResult>(cacheKey);
    if (cached) {
      logger.info(`Using cached explorer data for "${seed}"`);
      return cached;
    }

    logger.info(`Keywords Explorer: searching "${seed}" in ${country} (limit: ${limit})`);

    const [overviewRes, suggestionsRes] = await Promise.allSettled([
      this.fetchOverview(seed, country),
      this.fetchSuggestions(seed, country, limit),
    ]);

    const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
    const suggestionItems = suggestionsRes.status === 'fulfilled' ? suggestionsRes.value : [];

    const seen = new Set<string>();
    const keywords: ExplorerKeyword[] = [];

    for (const item of suggestionItems) {
      if (!item.keyword) continue;
      const norm = item.keyword.toLowerCase().trim();
      if (seen.has(norm)) continue;
      seen.add(norm);
      const kw = mapItem(item, 'idea');
      if (kw) keywords.push(kw);
    }

    keywords.sort((a, b) => b.volume - a.volume);

    const result: ExplorerResult = { seed, country, overview, keywords };
    cache.set(cacheKey, result, config.ahrefs.cacheTtl);
    return result;
  }
}

export const keywordsExplorerService = new KeywordsExplorerService();
export default keywordsExplorerService;
