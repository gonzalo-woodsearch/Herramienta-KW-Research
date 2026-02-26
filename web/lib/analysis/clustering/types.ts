/**
 * Tipos para análisis y clustering
 */

export interface Intent {
  hasLocalIntent: boolean;
  city?: string;
  hasCommercialIntent: boolean;
  commercialSignals: string[];
}

export interface TreatmentClassification {
  treatment: string | null;
  confidence: number;
}
