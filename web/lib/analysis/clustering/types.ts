/**
 * Tipos para análisis y clustering
 */

export type LocalLevel = 'none' | 'national' | 'regional' | 'city' | 'neighborhood' | 'ultralocal';

export interface LocalInfo {
  level: LocalLevel;
  city?: string;
  neighborhood?: string;
  region?: string;
  localScore: number; // 0-5
}

export type IntentType = 'transaccional' | 'informacional' | 'comercial' | 'local' | 'general';

export interface Intent {
  hasLocalIntent: boolean;
  localLevel: LocalLevel;
  city?: string;
  neighborhood?: string;
  region?: string;
  localScore: number;
  hasCommercialIntent: boolean;
  commercialSignals: string[];
  intentType: IntentType;
}

export interface TreatmentClassification {
  treatment: string | null;
  confidence: number;
}
