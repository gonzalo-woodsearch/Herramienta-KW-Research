/**
 * Tipos para Ahrefs API v3
 */

export interface AhrefsOrganicKeyword {
  keyword: string;
  position?: number;
  traffic?: number;
  volume?: number;
  url?: string;
  keyword_difficulty?: number;
}

export interface AhrefsOrganicKeywordsRequest {
  target: string;
  limit?: number;
  offset?: number;
  country?: string;
  select?: string;
}

export interface AhrefsOrganicKeywordsResponse {
  keywords: AhrefsOrganicKeyword[];
  pagination?: {
    offset: number;
    limit: number;
    total?: number;
  };
}

export interface AhrefsKeywordOverviewRequest {
  keyword: string;
  country?: string;
}

export interface AhrefsKeywordOverviewResponse {
  keyword: string;
  volume?: number;
  keyword_difficulty?: number;
  cpc?: number;
}

export interface AhrefsErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
