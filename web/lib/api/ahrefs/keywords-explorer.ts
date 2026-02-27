/**
 * Ahrefs Keywords Explorer - Búsqueda de ideas de keywords
 * Endpoints: matching-terms, search-suggestions, related-terms, overview
 */

import AhrefsClient from './client';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

const EXPLORER_SELECT = 'keyword,volume,cpc,difficulty,traffic_potential';

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

interface RawKw {
  keyword?: string;
  volume?: number;
  cpc?: number;
  difficulty?: number;
  traffic_potential?: number;
}

const QUESTION_PATTERN = /\?|\b(cómo|como|qué|que es|dónde|donde|cuándo|cuando|cuál|cual|quién|quien|cuánto|cuanto|por qué|porqué|para qué|para que)\b/i;
const COMPARISON_PATTERN = /\bvs\b|versus|\bmejor(es)?\b|\bdiferencia(s)?\b|\balternativa(s)?\b|\bcompar(ativa|ar|ación)\b|\bprecio(s)?\b|\bcoste?\b|\bcuánto cuesta\b|\bcuanto cuesta\b|\bbarato\b|\bbarata\b/i;

function categorize(keyword: string): KwCategory {
  if (QUESTION_PATTERN.test(keyword)) return 'question';
  if (COMPARISON_PATTERN.test(keyword)) return 'comparison';
  return 'idea';
}

function parseRows(response: unknown): RawKw[] {
  if (!response) return [];
  const r = response as any;
  if (Array.isArray(r.keywords)) return r.keywords;
  if (Array.isArray(r)) return r as RawKw[];
  return [];
}

function centsToEur(cents: number): number {
  return Math.round((cents / 100) * 10) / 10;
}

function mapKw(raw: RawKw, defaultCat: KwCategory): ExplorerKeyword | null {
  if (!raw.keyword) return null;
  const cat = categorize(raw.keyword);
  const finalCat: KwCategory = (cat === 'question' || cat === 'comparison') ? cat : defaultCat;
  return {
    keyword: raw.keyword,
    volume: raw.volume || 0,
    cpcEur: centsToEur(raw.cpc || 0),
    difficulty: raw.difficulty || 0,
    trafficPotential: raw.traffic_potential || 0,
    category: finalCat,
  };
}

export class KeywordsExplorerService {
  private client: AhrefsClient;

  constructor() {
    this.client = new AhrefsClient();
  }

  private async fetchOverview(seed: string, country: string): Promise<SeedOverview | null> {
    try {
      const res = await this.client.request('/keywords-explorer/overview', {
        keywords: seed,
        select: EXPLORER_SELECT,
        country: country.toUpperCase(),
      });
      const rows = parseRows(res);
      const row = rows[0];
      if (!row || !row.keyword) return null;
      return {
        keyword: row.keyword,
        volume: row.volume || 0,
        cpcEur: centsToEur(row.cpc || 0),
        difficulty: row.difficulty || 0,
        trafficPotential: row.traffic_potential || 0,
      };
    } catch (e) {
      logger.warn(`overview failed for "${seed}"`, e);
      return null;
    }
  }

  private async fetchMatchingTerms(seed: string, country: string, limit: number): Promise<RawKw[]> {
    try {
      const res = await this.client.request('/keywords-explorer/matching-terms', {
        keywords: seed,
        select: EXPLORER_SELECT,
        country: country.toUpperCase(),
        limit,
        order_by: 'volume:desc',
      });
      return parseRows(res);
    } catch (e) {
      logger.warn(`matching-terms failed for "${seed}"`, e);
      return [];
    }
  }

  private async fetchSearchSuggestions(seed: string, country: string, limit: number): Promise<RawKw[]> {
    try {
      const res = await this.client.request('/keywords-explorer/search-suggestions', {
        keywords: seed,
        select: EXPLORER_SELECT,
        country: country.toUpperCase(),
        limit,
        order_by: 'volume:desc',
      });
      return parseRows(res);
    } catch (e) {
      logger.warn(`search-suggestions failed for "${seed}"`, e);
      return [];
    }
  }

  private async fetchRelatedTerms(seed: string, country: string, limit: number): Promise<RawKw[]> {
    try {
      const res = await this.client.request('/keywords-explorer/related-terms', {
        keywords: seed,
        select: EXPLORER_SELECT,
        country: country.toUpperCase(),
        limit,
        order_by: 'volume:desc',
      });
      return parseRows(res);
    } catch (e) {
      logger.warn(`related-terms failed for "${seed}"`, e);
      return [];
    }
  }

  async explore(seed: string, country = 'ES', limit = 50): Promise<ExplorerResult> {
    const cacheKey = `ahrefs:explorer:${seed.toLowerCase().trim()}:${country}:${limit}`;
    const cached = cache.get<ExplorerResult>(cacheKey);
    if (cached) {
      logger.info(`Using cached explorer data for "${seed}"`);
      return cached;
    }

    logger.info(`Keywords Explorer: searching "${seed}" in ${country} (limit: ${limit})`);

    const [overviewRes, matchingRes, suggestionsRes, relatedRes] = await Promise.allSettled([
      this.fetchOverview(seed, country),
      this.fetchMatchingTerms(seed, country, limit),
      this.fetchSearchSuggestions(seed, country, Math.min(limit, 30)),
      this.fetchRelatedTerms(seed, country, Math.min(limit, 30)),
    ]);

    const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
    const matchingRaw = matchingRes.status === 'fulfilled' ? matchingRes.value : [];
    const suggestionsRaw = suggestionsRes.status === 'fulfilled' ? suggestionsRes.value : [];
    const relatedRaw = relatedRes.status === 'fulfilled' ? relatedRes.value : [];

    // Combine and deduplicate
    const seen = new Set<string>();
    const keywords: ExplorerKeyword[] = [];

    const addKeywords = (raws: RawKw[], defaultCat: KwCategory) => {
      for (const raw of raws) {
        if (!raw.keyword) continue;
        const norm = raw.keyword.toLowerCase().trim();
        if (seen.has(norm)) continue;
        seen.add(norm);
        const kw = mapKw(raw, defaultCat);
        if (kw) keywords.push(kw);
      }
    };

    addKeywords(matchingRaw, 'idea');
    addKeywords(suggestionsRaw, 'idea');
    addKeywords(relatedRaw, 'related');

    // Sort by volume desc
    keywords.sort((a, b) => b.volume - a.volume);

    const result: ExplorerResult = { seed, country, overview, keywords };
    cache.set(cacheKey, result, config.ahrefs.cacheTtl);
    return result;
  }
}

export const keywordsExplorerService = new KeywordsExplorerService();
export default keywordsExplorerService;
