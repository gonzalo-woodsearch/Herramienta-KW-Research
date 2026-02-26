/**
 * Tipos para Google Ads API
 */

export interface KeywordMetrics {
  keyword: string;
  avgMonthlySearches?: number;
  competition?: 'LOW' | 'MEDIUM' | 'HIGH';
  cpcMicros?: number;
}

export interface GoogleAdsHistoricalMetricsRequest {
  keywords: string[];
  geoTarget: string; // e.g., "geoTargetConstants/2724" for Spain
  language: string; // e.g., "languageConstants/1003" for Spanish
}

export interface GoogleAdsKeywordIdea {
  text: string;
  keyword_idea_metrics?: {
    avg_monthly_searches?: number;
    competition?: 'UNSPECIFIED' | 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';
    competition_index?: number;
    low_top_of_page_bid_micros?: number;
    high_top_of_page_bid_micros?: number;
  };
}

export const GEO_TARGETS = {
  ES: 'geoTargetConstants/2724', // España
};

export const LANGUAGES = {
  es: 'languageConstants/1003', // Español
};
