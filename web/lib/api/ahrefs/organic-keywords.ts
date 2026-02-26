/**
 * Endpoint: Site Explorer - Organic Keywords (Ahrefs API v3)
 * GET /site-explorer/organic-keywords
 * Campos requeridos: select, target, date
 */

import AhrefsClient from './client';
import { Keyword } from '../../types';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

// Campos correctos según la API v3 de Ahrefs
const DEFAULT_SELECT = 'keyword,best_position,sum_traffic,volume,best_position_url,keyword_difficulty';
const DEFAULT_LIMIT = 100;

interface AhrefsKeywordRow {
  keyword: string;
  best_position?: number;
  sum_traffic?: number;
  volume?: number;
  best_position_url?: string;
  keyword_difficulty?: number;
}

interface AhrefsOrganicKeywordsResponse {
  keywords?: AhrefsKeywordRow[];
  // La API v3 puede devolver el array directamente
}

export class OrganicKeywordsService {
  private client: AhrefsClient;

  constructor() {
    this.client = new AhrefsClient();
  }

  private getCacheKey(domain: string, country: string): string {
    return `ahrefs:organic:${domain}:${country}`;
  }

  private extractDomain(input: string): string {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const parsed = new URL(input);
        return parsed.hostname;
      } catch {
        return input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    }
    return input.replace(/\/.*$/, '');
  }

  async getOrganicKeywords(
    targetUrl: string,
    country: string = 'es',
    limit: number = DEFAULT_LIMIT
  ): Promise<Keyword[]> {
    const domain = this.extractDomain(targetUrl);
    const cacheKey = this.getCacheKey(domain, country);

    const cached = cache.get<Keyword[]>(cacheKey);
    if (cached) {
      logger.info(`Using cached Ahrefs data for ${domain}`);
      return cached.slice(0, limit);
    }

    logger.info(`Fetching organic keywords from Ahrefs for ${domain}`, { country, limit });

    // La API v3 requiere una fecha. Usamos hoy.
    const today = new Date().toISOString().split('T')[0];

    const params: Record<string, string | number> = {
      target: domain,
      select: DEFAULT_SELECT,
      date: today,
      limit,
      country: country.toUpperCase(),
      mode: 'subdomains',
    };

    let rows: AhrefsKeywordRow[] = [];

    try {
      const response = await this.client.request<AhrefsOrganicKeywordsResponse>(
        '/site-explorer/organic-keywords',
        params
      );

      // La API v3 devuelve { keywords: [...] }
      if (response && Array.isArray(response.keywords)) {
        rows = response.keywords;
      } else if (Array.isArray(response)) {
        // Por si devuelve el array directamente
        rows = response as unknown as AhrefsKeywordRow[];
      }

      logger.info(`Fetched ${rows.length} keywords from Ahrefs`);
    } catch (error) {
      logger.error(`Error fetching organic keywords for ${domain}`, error);
      throw error;
    }

    const keywords: Keyword[] = rows.map(kw => ({
      keyword: kw.keyword,
      normalizedKeyword: kw.keyword.toLowerCase(),
      position: kw.best_position,
      traffic: kw.sum_traffic,
      ahrefsVolume: kw.volume,
      url: kw.best_position_url || domain,
      keywordDifficulty: kw.keyword_difficulty,
    }));

    cache.set(cacheKey, keywords, config.ahrefs.cacheTtl);

    return keywords;
  }
}

export const organicKeywordsService = new OrganicKeywordsService();
export default organicKeywordsService;
