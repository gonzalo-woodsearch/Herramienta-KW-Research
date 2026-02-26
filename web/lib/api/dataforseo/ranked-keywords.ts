/**
 * DataForSEO Labs API - Domain Ranked Keywords (Live)
 * Obtiene keywords orgánicas de un dominio competidor
 */

import DataForSEOClient from './client';
import { Keyword } from '../../types';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

// España = location_code 2724, idioma español = es
const SPAIN_LOCATION_CODE = 2724;

interface DataForSEOTask {
  target: string;
  location_code: number;
  language_code: string;
  limit: number;
  order_by: string[];
  filters?: unknown[];
}

interface DataForSEOItem {
  keyword_data: {
    keyword: string;
    keyword_info?: {
      search_volume?: number;
      cpc?: number;
    };
    keyword_properties?: {
      keyword_difficulty?: number;
    };
  };
  ranked_serp_element?: {
    serp_item?: {
      rank_group?: number;
      rank_absolute?: number;
      url?: string;
      etv?: number;
    };
  };
}

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: Array<{
      items_count?: number;
      items?: DataForSEOItem[];
    }>;
  }>;
}

export class RankedKeywordsService {
  private client: DataForSEOClient;

  constructor() {
    this.client = new DataForSEOClient();
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

  private hasSpecificPath(url: string): boolean {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.pathname !== '/' && parsed.pathname !== '';
    } catch {
      return false;
    }
  }

  private normalizeUrlForMatch(url: string): string {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return (u.hostname + u.pathname).replace(/\/+$/, '').toLowerCase();
    } catch {
      return url.toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
    }
  }

  private applyTargetPage(keywords: Keyword[], targetUrl: string): Keyword[] {
    if (!this.hasSpecificPath(targetUrl)) {
      return keywords.map(kw => ({ ...kw, isTargetPage: true }));
    }
    const targetNorm = this.normalizeUrlForMatch(targetUrl);
    return keywords.map(kw => {
      const kwNorm = this.normalizeUrlForMatch(kw.url);
      const isTargetPage = kwNorm === targetNorm || kwNorm.startsWith(targetNorm + '/');
      return { ...kw, isTargetPage };
    });
  }

  private getCacheKey(domain: string): string {
    return `dataforseo:ranked:${domain}`;
  }

  async getRankedKeywords(
    targetUrl: string,
    _country: string = 'es',
    limit: number = 100
  ): Promise<Keyword[]> {
    const domain = this.extractDomain(targetUrl);
    const cacheKey = this.getCacheKey(domain);

    const cached = cache.get<Keyword[]>(cacheKey);
    if (cached) {
      logger.info(`Using cached DataForSEO data for ${domain}`);
      return this.applyTargetPage(cached.slice(0, limit), targetUrl);
    }

    logger.info(`Fetching ranked keywords from DataForSEO for ${domain}`, { limit });

    const task: DataForSEOTask = {
      target: domain,
      location_code: SPAIN_LOCATION_CODE,
      language_code: 'es',
      limit: Math.min(limit, 1000),
      order_by: ['ranked_serp_element.serp_item.etv,desc'],
    };

    const response = await this.client.post<DataForSEOResponse>(
      '/dataforseo_labs/google/ranked_keywords/live',
      [task]
    );

    if (response.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${response.status_message}`);
    }

    const taskResult = response.tasks?.[0];
    if (!taskResult || taskResult.status_code !== 20000) {
      throw new Error(`DataForSEO task error: ${taskResult?.status_message || 'Unknown error'}`);
    }

    const items: DataForSEOItem[] = taskResult.result?.[0]?.items || [];
    logger.info(`DataForSEO returned ${items.length} keywords for ${domain}`);

    const keywords: Keyword[] = items.map(item => {
      const kw = item.keyword_data;
      const serp = item.ranked_serp_element?.serp_item;

      return {
        keyword: kw.keyword,
        normalizedKeyword: kw.keyword.toLowerCase(),
        position: serp?.rank_group,
        traffic: serp?.etv ? Math.round(serp.etv) : undefined,
        ahrefsVolume: kw.keyword_info?.search_volume,
        url: serp?.url || domain,
        keywordDifficulty: kw.keyword_properties?.keyword_difficulty,
      };
    });

    cache.set(cacheKey, keywords, config.ahrefs.cacheTtl);

    return this.applyTargetPage(keywords.slice(0, limit), targetUrl);
  }
}

export const rankedKeywordsService = new RankedKeywordsService();
export default rankedKeywordsService;
