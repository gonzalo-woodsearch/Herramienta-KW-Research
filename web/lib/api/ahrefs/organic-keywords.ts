/**
 * Endpoint: Site Explorer - Organic Keywords
 */

import AhrefsClient from './client';
import {
  AhrefsOrganicKeywordsRequest,
  AhrefsOrganicKeywordsResponse,
  AhrefsOrganicKeyword,
} from './types';
import { Keyword } from '../../types';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

const DEFAULT_SELECT = 'keyword,position,traffic,volume,url';
const DEFAULT_LIMIT = 100;
const BATCH_SIZE = 1000; // Ahrefs max per request

export class OrganicKeywordsService {
  private client: AhrefsClient;

  constructor() {
    this.client = new AhrefsClient();
  }

  private getCacheKey(url: string, country: string): string {
    return `ahrefs:organic:${url}:${country}`;
  }

  async getOrganicKeywords(
    targetUrl: string,
    country: string = 'es',
    limit: number = DEFAULT_LIMIT
  ): Promise<Keyword[]> {
    const cacheKey = this.getCacheKey(targetUrl, country);

    // Intentar obtener del cache
    const cached = cache.get<Keyword[]>(cacheKey);
    if (cached) {
      logger.info(`Using cached Ahrefs data for ${targetUrl}`);
      return cached.slice(0, limit);
    }

    logger.info(`Fetching organic keywords from Ahrefs for ${targetUrl}`, {
      country,
      limit,
    });

    const allKeywords: AhrefsOrganicKeyword[] = [];
    let offset = 0;
    let hasMore = true;

    // Paginar hasta alcanzar el límite
    while (hasMore && allKeywords.length < limit) {
      const batchLimit = Math.min(BATCH_SIZE, limit - allKeywords.length);

      const request: AhrefsOrganicKeywordsRequest = {
        target: targetUrl,
        limit: batchLimit,
        offset,
        country,
        select: DEFAULT_SELECT,
      };

      try {
        const response = await this.client.request<AhrefsOrganicKeywordsResponse>(
          '/site-explorer/organic-keywords',
          'POST',
          request
        );

        if (!response.keywords || response.keywords.length === 0) {
          hasMore = false;
          break;
        }

        allKeywords.push(...response.keywords);
        offset += response.keywords.length;

        logger.debug(`Fetched ${response.keywords.length} keywords (total: ${allKeywords.length})`);

        // Si obtuvimos menos keywords que el límite solicitado, no hay más
        if (response.keywords.length < batchLimit) {
          hasMore = false;
        }
      } catch (error) {
        logger.error(`Error fetching organic keywords at offset ${offset}`, error);
        // Si falla una página, retornar lo que tenemos
        break;
      }
    }

    logger.info(`Total Ahrefs keywords fetched: ${allKeywords.length}`);

    // Convertir a formato interno
    const keywords: Keyword[] = allKeywords.map(kw => ({
      keyword: kw.keyword,
      normalizedKeyword: kw.keyword.toLowerCase(),
      position: kw.position,
      traffic: kw.traffic,
      ahrefsVolume: kw.volume,
      url: kw.url || targetUrl,
      keywordDifficulty: kw.keyword_difficulty,
    }));

    // Cachear resultado
    cache.set(cacheKey, keywords, config.ahrefs.cacheTtl);

    return keywords;
  }
}

export const organicKeywordsService = new OrganicKeywordsService();
export default organicKeywordsService;
