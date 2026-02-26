/**
 * Normalización y deduplicación de keywords
 */

import { Keyword } from '../../types';
import logger from '../../utils/logger';

/**
 * Normaliza una keyword:
 * - Lowercase
 * - Elimina tildes/acentos
 * - Trim
 * - Espacios múltiples → espacio simple
 */
export function normalize(keyword: string): string {
  return keyword
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres unicode
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (tildes)
    .trim()
    .replace(/\s+/g, ' '); // Múltiples espacios → uno
}

/**
 * Deduplica keywords por normalizedKeyword
 * - Combina volúmenes (suma)
 * - Promedia posiciones
 * - Mantiene el keyword original con mayor volumen/tráfico
 */
export function deduplicate(keywords: Keyword[]): Keyword[] {
  const map = new Map<string, Keyword[]>();

  // Agrupar por normalizedKeyword
  for (const kw of keywords) {
    const normalized = normalize(kw.keyword);
    const existing = map.get(normalized) || [];
    existing.push({ ...kw, normalizedKeyword: normalized });
    map.set(normalized, existing);
  }

  const deduplicated: Keyword[] = [];

  // Combinar duplicados
  for (const [normalized, group] of map.entries()) {
    if (group.length === 1) {
      deduplicated.push(group[0]);
      continue;
    }

    // Ordenar por tráfico/volumen descendente para elegir el mejor
    group.sort((a, b) => {
      const scoreA = (a.traffic || 0) + (a.ahrefsVolume || 0) + (a.avgMonthlySearches || 0);
      const scoreB = (b.traffic || 0) + (b.ahrefsVolume || 0) + (b.avgMonthlySearches || 0);
      return scoreB - scoreA;
    });

    const primary = group[0];

    // Combinar métricas
    const combined: Keyword = {
      ...primary,
      normalizedKeyword: normalized,
      // Sumar volúmenes
      traffic: group.reduce((sum, kw) => sum + (kw.traffic || 0), 0),
      ahrefsVolume: group.reduce((sum, kw) => sum + (kw.ahrefsVolume || 0), 0),
      avgMonthlySearches: group.reduce((sum, kw) => sum + (kw.avgMonthlySearches || 0), 0),
      // Promediar posición (tomar la mejor)
      position: Math.min(...group.map(kw => kw.position || Infinity).filter(p => p !== Infinity)),
      // Mantener otros campos del primary
      cpcMicros: primary.cpcMicros,
      competition: primary.competition,
      keywordDifficulty: primary.keywordDifficulty,
    };

    deduplicated.push(combined);
  }

  logger.info(`Deduplication: ${keywords.length} → ${deduplicated.length} keywords`, {
    duplicatesRemoved: keywords.length - deduplicated.length,
  });

  return deduplicated;
}

export default { normalize, deduplicate };
