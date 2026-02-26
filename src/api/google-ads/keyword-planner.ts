/**
 * Servicio: Google Ads Keyword Planner - Historical Metrics
 */

import GoogleAdsClient from './client.js';
import {
  KeywordMetrics,
  GoogleAdsKeywordIdea,
  GEO_TARGETS,
  LANGUAGES,
} from './types.js';
import { Keyword } from '../../types.js';
import cache from '../cache.js';
import config from '../../config.js';
import logger from '../../utils/logger.js';
import { retry } from '../../utils/retry.js';

const MAX_KEYWORDS_PER_REQUEST = 1000;

export class KeywordPlannerService {
  private client: GoogleAdsClient;

  constructor() {
    this.client = new GoogleAdsClient();
  }

  private getCacheKey(keyword: string, geo: string, lang: string): string {
    return `gads:metrics:${keyword}:${geo}:${lang}`;
  }

  private async fetchMetricsForBatch(
    keywords: string[],
    geoTarget: string,
    language: string
  ): Promise<KeywordMetrics[]> {
    return this.client.withRateLimit(async () => {
      return retry(async () => {
        const customer = await this.client.getCustomer();

        logger.debug(`Fetching Google Ads metrics for ${keywords.length} keywords`);

        try {
          // @ts-ignore - Google Ads API v23 interface compatibility
          const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
            customer_id: config.googleAds.customerId,
            keyword_seed: {
              keywords,
            },
            geo_target_constants: [geoTarget],
            language: language,
            include_adult_keywords: false,
            keyword_plan_network: 2, // GOOGLE_SEARCH_AND_PARTNERS
            page_size: keywords.length,
          } as any);

          const metrics: KeywordMetrics[] = [];

          if (response && Array.isArray(response)) {
            for (const idea of response as GoogleAdsKeywordIdea[]) {
              const kw = idea.text;
              const m = idea.keyword_idea_metrics;

              if (!kw || !m) continue;

              // Normalizar competition
              let competition: 'LOW' | 'MEDIUM' | 'HIGH' | undefined;
              if (m.competition === 'LOW' || m.competition === 'MEDIUM' || m.competition === 'HIGH') {
                competition = m.competition;
              }

              // CPC promedio (entre low y high)
              let cpcMicros: number | undefined;
              if (m.low_top_of_page_bid_micros && m.high_top_of_page_bid_micros) {
                cpcMicros = Math.round(
                  (m.low_top_of_page_bid_micros + m.high_top_of_page_bid_micros) / 2
                );
              }

              metrics.push({
                keyword: kw,
                avgMonthlySearches: m.avg_monthly_searches,
                competition,
                cpcMicros,
              });
            }
          }

          logger.debug(`Google Ads returned metrics for ${metrics.length} keywords`);
          return metrics;
        } catch (error: any) {
          logger.error('Error fetching Google Ads metrics', {
            error: error.message,
            keywords: keywords.slice(0, 5), // Log primeras 5 keywords
          });
          throw error;
        }
      }, {
        attempts: 3,
        delayMs: 2000,
      });
    });
  }

  async getHistoricalMetrics(
    keywords: Keyword[],
    country: string = 'ES',
    language: string = 'es'
  ): Promise<Keyword[]> {
    const geoTarget = GEO_TARGETS[country as keyof typeof GEO_TARGETS] || GEO_TARGETS.ES;
    const langConstant = LANGUAGES[language as keyof typeof LANGUAGES] || LANGUAGES.es;

    logger.info(`Enriching ${keywords.length} keywords with Google Ads metrics`, {
      country,
      language,
    });

    // Separar keywords en cache hits y misses
    const keywordsToFetch: string[] = [];
    const cachedMetrics: Map<string, KeywordMetrics> = new Map();

    for (const kw of keywords) {
      const cacheKey = this.getCacheKey(kw.keyword, country, language);
      const cached = cache.get<KeywordMetrics>(cacheKey);

      if (cached) {
        cachedMetrics.set(kw.keyword, cached);
      } else {
        keywordsToFetch.push(kw.keyword);
      }
    }

    logger.info(`Cache: ${cachedMetrics.size} hits, ${keywordsToFetch.length} misses`);

    // Fetch en batches
    const fetchedMetrics: Map<string, KeywordMetrics> = new Map();

    if (keywordsToFetch.length > 0) {
      for (let i = 0; i < keywordsToFetch.length; i += MAX_KEYWORDS_PER_REQUEST) {
        const batch = keywordsToFetch.slice(i, i + MAX_KEYWORDS_PER_REQUEST);

        try {
          const batchMetrics = await this.fetchMetricsForBatch(batch, geoTarget, langConstant);

          for (const metric of batchMetrics) {
            fetchedMetrics.set(metric.keyword, metric);

            // Cachear
            const cacheKey = this.getCacheKey(metric.keyword, country, language);
            cache.set(cacheKey, metric, config.googleAds.cacheTtl);
          }
        } catch (error) {
          logger.error(`Failed to fetch batch ${i / MAX_KEYWORDS_PER_REQUEST + 1}`, error);
          // Continuar con el siguiente batch
        }
      }
    }

    // Combinar resultados
    const enriched = keywords.map(kw => {
      const metrics = cachedMetrics.get(kw.keyword) || fetchedMetrics.get(kw.keyword);

      if (metrics) {
        return {
          ...kw,
          avgMonthlySearches: metrics.avgMonthlySearches,
          competition: metrics.competition,
          cpcMicros: metrics.cpcMicros,
        };
      }

      return kw;
    });

    const enrichedCount = enriched.filter(kw => kw.avgMonthlySearches !== undefined).length;
    logger.info(`Enriched ${enrichedCount}/${keywords.length} keywords with Google Ads data`);

    return enriched;
  }
}

export const keywordPlannerService = new KeywordPlannerService();
export default keywordPlannerService;
