/**
 * MCP Tool: buildReport
 */

import { BuildReportInput, BuildReportOutput } from '../types.js';
import { ReportMetadata } from '../../types.js';

export async function buildReport(input: BuildReportInput): Promise<BuildReportOutput> {
  const { keywords, clusters, url, country = 'ES' } = input;

  const metadata: ReportMetadata = {
    url,
    country,
    language: 'es',
    timestamp: new Date().toISOString(),
    totalKeywords: keywords.length,
  };

  // Build CSV string
  const csvLines: string[] = [
    'Keyword,Volume,CPC (EUR),Competition,KD,Treatment,Local Intent,City,Commercial Intent,Score,URL,Position',
  ];

  for (const kw of keywords) {
    const volume = kw.avgMonthlySearches || kw.ahrefsVolume || 0;
    const cpc = kw.cpcMicros ? (kw.cpcMicros / 1_000_000).toFixed(2) : '0.00';
    const competition = kw.competition || 'N/A';
    const kd = kw.keywordDifficulty || 0;
    const treatment = kw.treatment || 'N/A';
    const localIntent = kw.hasLocalIntent ? 'Yes' : 'No';
    const city = kw.city || 'N/A';
    const commercialIntent = kw.hasCommercialIntent ? 'Yes' : 'No';
    const score = kw.score || 0;
    const kwUrl = kw.url || '';
    const position = kw.position || 0;

    csvLines.push(
      `"${kw.keyword}",${volume},${cpc},${competition},${kd},${treatment},${localIntent},${city},${commercialIntent},${score},"${kwUrl}",${position}`
    );
  }

  const csv = csvLines.join('\n');

  // Build JSON string
  const jsonData = {
    metadata,
    keywords,
    clusters,
  };

  const json = JSON.stringify(jsonData, null, 2);

  // Build Markdown string
  const mdLines: string[] = [];

  mdLines.push('# Keyword Research Report - Dental España\n');
  mdLines.push(`**URL:** ${url}`);
  mdLines.push(`**Date:** ${metadata.timestamp}`);
  mdLines.push(`**Total Keywords:** ${keywords.length}\n`);
  mdLines.push('---\n');

  // Top opportunities
  const topOpportunities = keywords.filter(kw => (kw.score || 0) > 70);
  if (topOpportunities.length > 0) {
    mdLines.push(`## 🎯 Top Opportunities (${topOpportunities.length} keywords)\n`);
    mdLines.push('| Keyword | Volume | Score | Treatment |');
    mdLines.push('|---------|--------|-------|-----------|');

    for (const kw of topOpportunities.slice(0, 10)) {
      const volume = kw.avgMonthlySearches || kw.ahrefsVolume || 0;
      mdLines.push(`| ${kw.keyword} | ${volume} | ${kw.score} | ${kw.treatment || 'N/A'} |`);
    }

    mdLines.push('');
  }

  // Clusters
  mdLines.push('## 📊 Clusters\n');
  for (const cluster of clusters.slice(0, 5)) {
    mdLines.push(`### ${cluster.treatment} (${cluster.count} keywords, avg score: ${cluster.avgScore})\n`);
  }

  const markdown = mdLines.join('\n');

  return {
    markdown,
    csv,
    json,
  };
}

export default buildReport;
