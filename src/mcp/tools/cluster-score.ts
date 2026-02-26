/**
 * MCP Tool: clusterAndScore
 */

import { detectTreatment } from '../../analysis/clustering/dental-classifier.js';
import { detectIntent } from '../../analysis/clustering/intent-detector.js';
import { scoreKeywords } from '../../analysis/scoring/scorer.js';
import { clusterByTreatment } from '../../analysis/clustering/cluster.js';
import { ClusterScoreInput, ClusterScoreOutput } from '../types.js';
import { Keyword } from '../../types.js';

export async function clusterAndScore(input: ClusterScoreInput): Promise<ClusterScoreOutput> {
  const { keywords } = input;

  // Classify and detect intent
  const classified: Keyword[] = keywords.map(kw => {
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

  // Calculate scores
  const scored = scoreKeywords(classified);

  // Sort by score
  scored.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Cluster
  const clusters = clusterByTreatment(scored);

  return {
    analyzed: scored,
    clusters,
  };
}

export default clusterAndScore;
