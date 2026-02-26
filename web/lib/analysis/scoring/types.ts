/**
 * Tipos para sistema de scoring
 */

export interface ScoringWeights {
  volume: number; // 0.4 (40%)
  cpc: number; // 0.2 (20%)
  kd: number; // 0.3 (30%, resta)
  competition: number; // 0.1 (10%, resta)
}

export interface ScoringLimits {
  maxVolume: number; // 10,000
  maxCpcEuros: number; // 5€
}

export interface BoostConfig {
  localWithCity: number; // +10
  coreTreatment: number; // +10
  commercialSignals: number; // +5
}
