/**
 * MCP Tool: googleAdsHistoricalMetrics
 */

import { keywordPlannerService } from '../../api/google-ads/keyword-planner.js';
import { GoogleAdsMetricsInput } from '../types.js';
import { Keyword } from '../../types.js';

export async function googleAdsHistoricalMetrics(input: GoogleAdsMetricsInput) {
  const { keywords, geo = 'ES', lang = 'es' } = input;

  // Convert string[] to Keyword[]
  const keywordObjects: Keyword[] = keywords.map(kw => ({
    keyword: kw,
    normalizedKeyword: kw.toLowerCase(),
    url: '',
  }));

  const enriched = await keywordPlannerService.getHistoricalMetrics(keywordObjects, geo, lang);

  return {
    success: true,
    count: enriched.length,
    metrics: enriched.map(kw => ({
      keyword: kw.keyword,
      avgMonthlySearches: kw.avgMonthlySearches,
      competition: kw.competition,
      cpcMicros: kw.cpcMicros,
    })),
  };
}

export default googleAdsHistoricalMetrics;
