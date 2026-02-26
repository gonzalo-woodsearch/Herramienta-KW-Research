/**
 * Sistema de scoring 0-100 para keywords
 */

import { Keyword, ScoreBreakdown } from '../../types.js';
import { calculateBoosts } from './boosts.js';
import logger from '../../utils/logger.js';

// Scoring weights: volume(40%), cpc(20%), kd(30%), competition(10%)
const LIMITS = {
  maxVolume: 10000, // búsquedas/mes
  maxCpcEuros: 5, // euros
};

/**
 * Normaliza volumen de búsquedas a 0-40 puntos
 */
function scoreVolume(volume: number | undefined): number {
  if (!volume || volume <= 0) return 0;

  const normalized = Math.min(volume / LIMITS.maxVolume, 1);
  return normalized * 40; // Max 40 puntos
}

/**
 * Normaliza CPC a 0-20 puntos
 */
function scoreCpc(cpcMicros: number | undefined): number {
  if (!cpcMicros || cpcMicros <= 0) return 0;

  const cpcEuros = cpcMicros / 1_000_000;
  const normalized = Math.min(cpcEuros / LIMITS.maxCpcEuros, 1);
  return normalized * 20; // Max 20 puntos
}

/**
 * Convierte KD a penalización 0-30 puntos
 */
function scoreKd(kd: number | undefined): number {
  if (!kd || kd <= 0) return 0;

  // KD ya está en 0-100, multiplicar por 0.3
  return kd * 0.3; // Max 30 puntos de penalización
}

/**
 * Convierte competition a penalización 0-10 puntos
 */
function scoreCompetition(competition: string | undefined): number {
  if (!competition) return 0;

  switch (competition) {
    case 'HIGH':
      return 10;
    case 'MEDIUM':
      return 5;
    case 'LOW':
    default:
      return 0;
  }
}

/**
 * Calcula el score completo para una keyword
 */
export function calculateScore(kw: Keyword): { score: number; breakdown: ScoreBreakdown } {
  // Componentes positivos
  const volumeScore = scoreVolume(kw.avgMonthlySearches || kw.ahrefsVolume);
  const cpcScore = scoreCpc(kw.cpcMicros);

  // Componentes negativos (penalizaciones)
  const kdPenalty = scoreKd(kw.keywordDifficulty);
  const competitionPenalty = scoreCompetition(kw.competition);

  // Boosts
  const boosts = calculateBoosts(kw);

  // Score total
  let total = volumeScore + cpcScore - kdPenalty - competitionPenalty + boosts;

  // Clamp a [0, 100]
  total = Math.max(0, Math.min(100, total));
  const score = Math.round(total);

  const breakdown: ScoreBreakdown = {
    volume: Math.round(volumeScore * 10) / 10,
    cpc: Math.round(cpcScore * 10) / 10,
    kd: Math.round(kdPenalty * 10) / 10,
    competition: Math.round(competitionPenalty * 10) / 10,
    boosts: boosts,
    total: score,
  };

  logger.debug(`Score for "${kw.keyword}": ${score}`, breakdown);

  return { score, breakdown };
}

/**
 * Calcula scores para un array de keywords
 */
export function scoreKeywords(keywords: Keyword[]): Keyword[] {
  logger.info(`Calculating scores for ${keywords.length} keywords`);

  const scored = keywords.map(kw => {
    const { score, breakdown } = calculateScore(kw);
    return {
      ...kw,
      score,
      scoreBreakdown: breakdown,
    };
  });

  // Estadísticas
  const avgScore = scored.reduce((sum, kw) => sum + (kw.score || 0), 0) / scored.length;
  const highScoreCount = scored.filter(kw => (kw.score || 0) > 70).length;

  logger.info(`Scoring complete`, {
    avgScore: Math.round(avgScore),
    highScoreCount,
    maxScore: Math.max(...scored.map(kw => kw.score || 0)),
  });

  return scored;
}

export default { calculateScore, scoreKeywords };
