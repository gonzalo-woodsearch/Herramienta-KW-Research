/**
 * DataForSEO Keywords Explorer
 * Uses /dataforseo_labs/google/keyword_suggestions/live
 * - seed_keyword_data  → overview metrics for the seed
 * - items              → related keyword ideas
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

interface DfsKwInfo {
  search_volume?: number;
  cpc?: number;
  competition?: number;
  competition_level?: string;
}

interface DfsKwProps {
  keyword_difficulty?: number;
}

interface DfsItem {
  keyword?: string;
  keyword_info?: DfsKwInfo;
  keyword_properties?: DfsKwProps;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: Array<{
      seed_keyword?: string;
      seed_keyword_data?: {
        keyword_info?: DfsKwInfo;
        keyword_properties?: DfsKwProps;
      };
      items_count?: number;
      items?: DfsItem[];
    }>;
  }>;
}

const QUESTION_PATTERN = /\?|\b(cómo|como|qué|que es|dónde|donde|cuándo|cuando|cuál|cual|quién|quien|cuánto|cuanto|por qué|porqué|para qué|para que)\b/i;
const COMPARISON_PATTERN = /\bvs\b|versus|\bmejor(es)?\b|\bdiferencia(s)?\b|\balternativa(s)?\b|\bcompar(ativa|ar|ación)\b|\bprecio(s)?\b|\bcoste?\b|\bcuánto cuesta\b|\bcuanto cuesta\b|\bbarato\b|\bbarata\b/i;

function categorize(keyword: string): KwCategory {
  if (QUESTION_PATTERN.test(keyword)) return 'question';
  if (COMPARISON_PATTERN.test(keyword)) return 'comparison';
  return 'idea';
}

function toCpc(usd: number): number {
  return Math.round(usd * 10) / 10;
}

function mapItem(item: DfsItem, defaultCat: KwCategory): ExplorerKeyword | null {
  if (!item.keyword) return null;
  const cat = categorize(item.keyword);
  return {
    keyword: item.keyword,
    volume: item.keyword_info?.search_volume || 0,
    cpcEur: toCpc(item.keyword_info?.cpc || 0),
    difficulty: item.keyword_properties?.keyword_difficulty || 0,
    trafficPotential: 0,
    category: (cat === 'question' || cat === 'comparison') ? cat : defaultCat,
  };
}

export class KeywordsExplorerService {
  private client: DataForSEOClient;

  constructor() {
    this.client = new DataForSEOClient();
  }

  private getGeo(country: string) {
    return GEO_MAP[country.toUpperCase()] ?? GEO_MAP['ES'];
  }

  async explore(seed: string, country = 'ES', limit = 50): Promise<ExplorerResult> {
    const cacheKey = `dfs:explorer:${seed.toLowerCase().trim()}:${country}:${limit}`;
    const cached = cache.get<ExplorerResult>(cacheKey);
    if (cached) {
      logger.info(`Using cached explorer data for "${seed}"`);
      return cached;
    }

    logger.info(`Keywords Explorer: searching "${seed}" in ${country} (limit: ${limit})`);
    const geo = this.getGeo(country);

    let overview: SeedOverview | null = null;
    const keywords: ExplorerKeyword[] = [];

    try {
      const res = await this.client.post<DfsResponse>(
        '/dataforseo_labs/google/keyword_suggestions/live',
        [{
          keyword: seed,
          location_code: geo.location_code,
          language_code: geo.language_code,
          limit,
          order_by: ['keyword_info.search_volume,desc'],
          include_seed_keyword: true,
        }]
      );

      if (res.status_code !== 20000) {
        throw new Error(`DataForSEO error ${res.status_code}: ${res.status_message}`);
      }

      const task = res.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        throw new Error(`Task error: ${task?.status_message || 'unknown'}`);
      }

      const r0 = task.result?.[0];
      if (!r0) throw new Error('Empty result from DataForSEO');

      // Extract overview from seed_keyword_data
      const seedData = r0.seed_keyword_data;
      if (seedData?.keyword_info) {
        overview = {
          keyword: seed,
          volume: seedData.keyword_info.search_volume || 0,
          cpcEur: toCpc(seedData.keyword_info.cpc || 0),
          difficulty: seedData.keyword_properties?.keyword_difficulty || 0,
          trafficPotential: 0,
        };
      }

      // Build keyword ideas from items
      const seen = new Set<string>([seed.toLowerCase().trim()]);
      for (const item of r0.items ?? []) {
        if (!item.keyword) continue;
        const norm = item.keyword.toLowerCase().trim();
        if (seen.has(norm)) continue;
        seen.add(norm);
        const kw = mapItem(item, 'idea');
        if (kw) keywords.push(kw);
      }

      keywords.sort((a, b) => b.volume - a.volume);
    } catch (e: any) {
      logger.warn(`Keywords Explorer failed for "${seed}": ${e.message}`);
      // Return what we have so far (may be empty)
    }

    const result: ExplorerResult = { seed, country, overview, keywords };

    // Only cache if we got useful data
    if (overview || keywords.length > 0) {
      cache.set(cacheKey, result, config.ahrefs.cacheTtl);
    }

    return result;
  }
}

export const keywordsExplorerService = new KeywordsExplorerService();
export default keywordsExplorerService;
