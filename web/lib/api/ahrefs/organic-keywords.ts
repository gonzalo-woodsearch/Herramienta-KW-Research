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

  private extractDomain(input: string): string {
    // Si tiene protocolo, extraer solo el hostname
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const parsed = new URL(input);
        return parsed.hostname;
      } catch {
        // Si falla el parseo, limpiar manualmente
        return input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    }
    // Si no tiene protocolo, quitar path y trailing slash
    return input.replace(/\/.*$/, '');
  }

  async getOrganicKeywords(
    targetUrl: string,
    country: string = 'es',
    limit: number = DEFAULT_LIMIT
  ): Promise<Keyword[]> {
    // Ahrefs espera solo el dominio, sin protocolo ni path
    const domain = this.extractDomain(targetUrl);
    const cacheKey = this.getCacheKey(domain, country);

    // Intentar obtener del cache
    const cached = cache.get<Keyword[]>(cacheKey);
    if (cached) {
      logger.info(`Using cached Ahrefs data for ${domain}`);
      return cached.slice(0, limit);
    }

    logger.info(`Fetching organic keywords from Ahrefs for ${domain}`, {
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
        target: domain,
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
        // Re-lanzar el error para que el API route lo muestre al usuario
        throw error;
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
      url: kw.url || domain,
      keywordDifficulty: kw.keyword_difficulty,
    }));

    // Cachear resultado
    cache.set(cacheKey, keywords, config.ahrefs.cacheTtl);

    return keywords;
  }
}

export const organicKeywordsService = new OrganicKeywordsService();
export default organicKeywordsService;
