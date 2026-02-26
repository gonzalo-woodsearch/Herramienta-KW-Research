/**
 * Tipos para MCP Server
 */

import { Keyword, ClusteredKeywords } from '../types.js';

export interface AhrefsOrganicInput {
  url: string;
  country?: string;
  limit?: number;
}

export interface GoogleAdsMetricsInput {
  keywords: string[];
  geo?: string;
  lang?: string;
}

export interface ClusterScoreInput {
  keywords: Keyword[];
}

export interface ClusterScoreOutput {
  analyzed: Keyword[];
  clusters: ClusteredKeywords[];
}

export interface BuildReportInput {
  keywords: Keyword[];
  clusters: ClusteredKeywords[];
  url: string;
  country?: string;
}

export interface BuildReportOutput {
  markdown: string;
  csv: string;
  json: string;
}
