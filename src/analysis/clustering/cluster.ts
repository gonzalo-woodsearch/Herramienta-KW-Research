/**
 * Clustering de keywords por tratamiento dental
 */

import { Keyword, ClusteredKeywords } from '../../types.js';
import logger from '../../utils/logger.js';

/**
 * Agrupa keywords por tratamiento dental
 */
export function clusterByTreatment(keywords: Keyword[]): ClusteredKeywords[] {
  const clusters = new Map<string, Keyword[]>();

  // Agrupar por tratamiento
  for (const kw of keywords) {
    const treatment = kw.treatment || 'sin_clasificar';

    if (!clusters.has(treatment)) {
      clusters.set(treatment, []);
    }

    clusters.get(treatment)!.push(kw);
  }

  // Convertir a array y calcular métricas
  const result: ClusteredKeywords[] = [];

  for (const [treatment, kwList] of clusters.entries()) {
    // Ordenar por score descendente
    kwList.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Calcular métricas agregadas
    const avgScore =
      kwList.reduce((sum, kw) => sum + (kw.score || 0), 0) / kwList.length;

    const totalVolume = kwList.reduce(
      (sum, kw) => sum + (kw.avgMonthlySearches || kw.ahrefsVolume || 0),
      0
    );

    result.push({
      treatment,
      keywords: kwList,
      count: kwList.length,
      avgScore: Math.round(avgScore),
      totalVolume,
      topKeywords: kwList.slice(0, 10), // Top 10 por score
    });
  }

  // Ordenar clusters por avgScore descendente
  result.sort((a, b) => b.avgScore - a.avgScore);

  logger.info(`Clustering complete: ${result.length} clusters`, {
    clusters: result.map(c => ({ treatment: c.treatment, count: c.count, avgScore: c.avgScore })),
  });

  return result;
}

export default clusterByTreatment;
