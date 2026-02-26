/**
 * Wrapper to use the existing keyword research logic from the CLI tool
 * This imports and executes the core analysis pipeline
 */

import { Keyword, ClusteredKeywords } from './types';

// Import core services
import { organicKeywordsService } from './api/ahrefs/organic-keywords';
import { deduplicate } from './analysis/clustering/normalizer';
import { detectTreatment } from './analysis/clustering/dental-classifier';
import { detectIntent } from './analysis/clustering/intent-detector';
import { scoreKeywords } from './analysis/scoring/scorer';
import { clusterByTreatment } from './analysis/clustering/cluster';

export interface AnalysisRequest {
  url: string;
  country?: string;
  lang?: string;
  limit?: number;
}

export interface AnalysisResult {
  keywords: Keyword[];
  clusters: ClusteredKeywords[];
  metadata: {
    url: string;
    country: string;
    totalKeywords: number;
    highScoreKeywords: number;
    processingTime: number;
  };
}

export async function analyzeUrl(request: AnalysisRequest): Promise<AnalysisResult> {
  const startTime = Date.now();

  const {
    url,
    country = 'ES',
    lang = 'es',
    limit = 50,
  } = request;

  console.log(`[Analysis] Starting analysis for ${url}`);

  // Step 1: Fetch organic keywords from Ahrefs
  console.log('[Analysis] Step 1/5: Fetching keywords from Ahrefs...');
  const ahrefsKeywords = await organicKeywordsService.getOrganicKeywords(url, country, limit);
  console.log(`[Analysis] Fetched ${ahrefsKeywords.length} keywords`);

  // Step 2: Normalize and deduplicate
  console.log('[Analysis] Step 2/5: Normalizing and deduplicating...');
  const normalized = deduplicate(ahrefsKeywords);
  console.log(`[Analysis] After deduplication: ${normalized.length} keywords`);

  // Step 3: Skip Google Ads enrichment (not configured yet)
  console.log('[Analysis] Step 3/5: Skipping Google Ads (not configured)');
  const enriched = normalized;

  // Step 4: Classify treatments and detect intent
  console.log('[Analysis] Step 4/5: Classifying treatments and intent...');
  const analyzed = enriched.map(kw => {
    const treatment = detectTreatment(kw.keyword);
    const intent = detectIntent(kw.keyword);
    return {
      ...kw,
      treatment,
      ...intent,
    };
  });

  // Step 5: Calculate scores
  console.log('[Analysis] Step 5/5: Calculating scores...');
  const scored = scoreKeywords(analyzed);

  // Sort by score descending
  const sorted = scored.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Create clusters
  const clusters = clusterByTreatment(sorted);

  const processingTime = Date.now() - startTime;
  const highScoreKeywords = sorted.filter(kw => (kw.score || 0) > 70).length;

  console.log(`[Analysis] Complete! ${sorted.length} keywords, ${highScoreKeywords} high-score (>70)`);
  console.log(`[Analysis] Processing time: ${(processingTime / 1000).toFixed(2)}s`);

  return {
    keywords: sorted,
    clusters,
    metadata: {
      url,
      country,
      totalKeywords: sorted.length,
      highScoreKeywords,
      processingTime,
    },
  };
}
