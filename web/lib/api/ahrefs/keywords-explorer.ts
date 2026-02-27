/**
 * DataForSEO Keywords Explorer
 *
 * Overview:  /keywords_data/google_ads/search_volume/live
 * Ideas:     /keywords_data/google_ads/keywords_for_keywords/live
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
  _debug?: any;
}

// Raw item shape returned by Google Ads endpoints
interface GadsItem {
  keyword?: string;
  search_volume?: number;
  cpc?: number;
  competition?: string;        // "LOW" | "MEDIUM" | "HIGH" | null
  competition_index?: number;  // 0-100
  low_top_of_page_bid?: number;
  high_top_of_page_bid?: number;
  monthly_searches?: unknown[];
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

function compToDifficulty(item: GadsItem): number {
  if (item.competition_index != null) return item.competition_index;
  if (item.competition === 'HIGH') return 75;
  if (item.competition === 'MEDIUM') return 45;
  if (item.competition === 'LOW') return 15;
  return 0;
}

function toCpc(usd: number): number {
  return Math.round(usd * 10) / 10;
}

function mapGadsItem(item: GadsItem, defaultCat: KwCategory): ExplorerKeyword | null {
  if (!item.keyword) return null;
  const cat = categorize(item.keyword);
  const cpcValue = item.cpc ?? item.high_top_of_page_bid ?? 0;
  return {
    keyword: item.keyword,
    volume: item.search_volume || 0,
    cpcEur: toCpc(cpcValue),
    difficulty: compToDifficulty(item),
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

  private async fetchOverview(seed: string, country: string): Promise<SeedOverview | null> {
    const geo = this.getGeo(country);
    const res = await this.client.post<DfsResponse>(
      '/keywords_data/google_ads/search_volume/live',
      [{
        keywords: [seed],
        location_code: geo.location_code,
        language_code: geo.language_code,
      }]
    );

    if (res.status_code !== 20000) throw new Error(`search_volume API: ${res.status_message}`);
    const task = res.tasks?.[0];
    if (!task || task.status_code !== 20000) throw new Error(`search_volume task: ${task?.status_message}`);

    const items: GadsItem[] = task.result || [];
    const item = items.find(i => i.keyword?.toLowerCase() === seed.toLowerCase()) ?? items[0];
    if (!item) return null;

    return {
      keyword: item.keyword ?? seed,
      volume: item.search_volume || 0,
      cpcEur: toCpc(item.cpc ?? item.high_top_of_page_bid ?? 0),
      difficulty: compToDifficulty(item),
      trafficPotential: 0,
    };
  }

  private async fetchIdeas(seed: string, country: string): Promise<{ items: GadsItem[]; debug: any }> {
    const geo = this.getGeo(country);
    let rawResponse: any = null;

    try {
      const res = await this.client.post<DfsResponse>(
        '/keywords_data/google_ads/keywords_for_keywords/live',
        [{
          keywords: [seed],
          location_code: geo.location_code,
          language_code: geo.language_code,
        }]
      );

      rawResponse = {
        status_code: res.status_code,
        status_message: res.status_message,
        task_status: res.tasks?.[0]?.status_code,
        task_message: res.tasks?.[0]?.status_message,
        result_type: typeof res.tasks?.[0]?.result,
        result_is_array: Array.isArray(res.tasks?.[0]?.result),
        result_length: res.tasks?.[0]?.result?.length ?? 0,
        first_item_keys: res.tasks?.[0]?.result?.[0] ? Object.keys(res.tasks[0].result[0]) : [],
        first_item_sample: res.tasks?.[0]?.result?.[0] ?? null,
      };

      if (res.status_code !== 20000) {
        return { items: [], debug: { ...rawResponse, error: `API error: ${res.status_message}` } };
      }

      const task = res.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        return { items: [], debug: { ...rawResponse, error: `Task error: ${task?.status_message}` } };
      }

      const r = task.result;
      if (!r || !Array.isArray(r) || r.length === 0) {
        return { items: [], debug: { ...rawResponse, note: 'result is empty or not array' } };
      }

      // Handle both flat array and nested structure
      if (Array.isArray(r[0]?.items)) {
        return { items: r[0].items, debug: { ...rawResponse, structure: 'nested result[0].items', count: r[0].items.length } };
      }

      return { items: r as GadsItem[], debug: { ...rawResponse, structure: 'flat result array', count: r.length } };

    } catch (err: any) {
      return { items: [], debug: { raw: rawResponse, error: err.message } };
    }
  }

  async explore(seed: string, country = 'ES', limit = 50): Promise<ExplorerResult> {
    const cacheKey = `dfs5:explorer:${seed.toLowerCase().trim()}:${country}`;
    const cached = cache.get<ExplorerResult>(cacheKey);
    if (cached) {
      logger.info(`Using cached explorer data for "${seed}"`);
      return { ...cached, keywords: cached.keywords.slice(0, limit) };
    }

    logger.info(`Keywords Explorer: searching "${seed}" in ${country}`);

    const [overviewRes, ideasRes] = await Promise.allSettled([
      this.fetchOverview(seed, country),
      this.fetchIdeas(seed, country),
    ]);

    const debugInfo: any = {};

    if (overviewRes.status === 'rejected') {
      logger.warn(`Overview failed for "${seed}": ${overviewRes.reason}`);
      debugInfo.overviewError = String(overviewRes.reason);
    }

    const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;

    let rawItems: GadsItem[] = [];
    if (ideasRes.status === 'fulfilled') {
      rawItems = ideasRes.value.items;
      debugInfo.ideasApi = ideasRes.value.debug;
    } else {
      logger.warn(`Ideas failed for "${seed}": ${ideasRes.reason}`);
      debugInfo.ideasError = String(ideasRes.reason);
    }

    const seen = new Set<string>([seed.toLowerCase().trim()]);
    const keywords: ExplorerKeyword[] = [];

    for (const item of rawItems) {
      if (!item.keyword) continue;
      const norm = item.keyword.toLowerCase().trim();
      if (seen.has(norm)) continue;
      seen.add(norm);
      const kw = mapGadsItem(item, 'idea');
      if (kw) keywords.push(kw);
    }

    keywords.sort((a, b) => b.volume - a.volume);

    const result: ExplorerResult = { seed, country, overview, keywords, _debug: debugInfo };

    if (overview || keywords.length > 0) {
      // Cache without _debug
      const { _debug, ...toCache } = result;
      cache.set(cacheKey, toCache as ExplorerResult, config.ahrefs.cacheTtl);
    }

    return { ...result, keywords: keywords.slice(0, limit) };
  }
}

export const keywordsExplorerService = new KeywordsExplorerService();
export default keywordsExplorerService;
