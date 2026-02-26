/**
 * Comando: kwtool url
 * Pipeline completo de análisis de keywords
 */

import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { Keyword, UrlCommandOptions, ReportMetadata } from '../../types.js';
import { organicKeywordsService } from '../../api/ahrefs/organic-keywords.js';
import { keywordPlannerService } from '../../api/google-ads/keyword-planner.js';
import { deduplicate } from '../../analysis/clustering/normalizer.js';
import { detectTreatment } from '../../analysis/clustering/dental-classifier.js';
import { detectIntent } from '../../analysis/clustering/intent-detector.js';
import { scoreKeywords } from '../../analysis/scoring/scorer.js';
import { clusterByTreatment } from '../../analysis/clustering/cluster.js';
import { writeCsv } from '../../output/csv-writer.js';
import { writeJson } from '../../output/json-writer.js';
import { writeMarkdown } from '../../output/markdown-writer.js';
import logger from '../../utils/logger.js';

export async function processUrl(options: UrlCommandOptions): Promise<void> {
  const startTime = Date.now();

  logger.info('Starting keyword research pipeline', {
    url: options.url,
    country: options.country,
    lang: options.lang,
    limit: options.limit,
  });

  try {
    // 1. Fetch organic keywords from Ahrefs
    logger.info('Step 1/6: Fetching organic keywords from Ahrefs...');
    const ahrefsKeywords = await organicKeywordsService.getOrganicKeywords(
      options.url,
      options.country,
      options.limit
    );

    if (ahrefsKeywords.length === 0) {
      logger.warn('No organic keywords found from Ahrefs. Exiting.');
      console.log('\n⚠️  No keywords found for this URL.');
      return;
    }

    logger.info(`✓ Fetched ${ahrefsKeywords.length} keywords from Ahrefs`);

    // 2. Normalize and deduplicate
    logger.info('Step 2/6: Normalizing and deduplicating keywords...');
    const normalized = deduplicate(ahrefsKeywords);
    logger.info(`✓ After deduplication: ${normalized.length} unique keywords`);

    // 3. Enrich with Google Ads metrics
    logger.info('Step 3/6: Enriching with Google Ads metrics...');
    const enriched = await keywordPlannerService.getHistoricalMetrics(
      normalized,
      options.country,
      options.lang
    );
    logger.info(`✓ Enriched ${enriched.length} keywords with Google Ads data`);

    // 4. Classify and detect intent
    logger.info('Step 4/6: Classifying treatments and detecting intent...');
    const classified: Keyword[] = enriched.map(kw => {
      const treatment = detectTreatment(kw.keyword);
      const intent = detectIntent(kw.keyword);

      return {
        ...kw,
        treatment,
        hasLocalIntent: intent.hasLocalIntent,
        city: intent.city,
        hasCommercialIntent: intent.hasCommercialIntent,
        commercialSignals: intent.commercialSignals,
      };
    });
    logger.info(`✓ Classification complete`);

    // 5. Calculate scores
    logger.info('Step 5/6: Calculating scores...');
    const scored = scoreKeywords(classified);

    // Sort by score descending
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    logger.info(`✓ Scoring complete`);

    // 6. Cluster by treatment
    logger.info('Step 6/6: Clustering by treatment...');
    const clusters = clusterByTreatment(scored);
    logger.info(`✓ Created ${clusters.length} clusters`);

    // Create output directory
    await mkdir(options.out, { recursive: true });

    // Generate metadata
    const metadata: ReportMetadata = {
      url: options.url,
      country: options.country,
      language: options.lang,
      timestamp: new Date().toISOString(),
      totalKeywords: scored.length,
      processingTime: Date.now() - startTime,
    };

    // Write outputs
    logger.info('Writing outputs...');
    await Promise.all([
      writeCsv(scored, `${options.out}/keywords.csv`),
      writeJson(scored, clusters, metadata, `${options.out}/keywords.json`),
      writeMarkdown(scored, clusters, metadata, `${options.out}/report.md`),
    ]);

    // Success message
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n✅ Analysis complete!');
    console.log(`\n📊 Results:`);
    console.log(`   - Total keywords: ${scored.length}`);
    console.log(`   - High-score keywords (>70): ${scored.filter(k => (k.score || 0) > 70).length}`);
    console.log(`   - Treatment clusters: ${clusters.length}`);
    console.log(`   - Processing time: ${duration}s`);
    console.log(`\n📁 Outputs written to: ${options.out}`);
    console.log(`   - keywords.csv`);
    console.log(`   - keywords.json`);
    console.log(`   - report.md`);

    logger.info(`Pipeline completed successfully in ${duration}s`);
  } catch (error) {
    logger.error('Pipeline failed', error);
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export default processUrl;
