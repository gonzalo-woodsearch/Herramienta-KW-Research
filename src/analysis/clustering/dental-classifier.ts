/**
 * Clasificador de tratamientos dentales para España
 */

import { normalize } from './normalizer.js';
import logger from '../../utils/logger.js';

/**
 * Patrones de tratamientos dentales
 * Cada tratamiento tiene una lista de keywords/patrones que lo identifican
 */
export const DENTAL_TREATMENTS: Record<string, string[]> = {
  implantes: [
    'implante',
    'implantes',
    'cigomatico',
    'cigomaticos',
    'all on 4',
    'all on 6',
    'all-on-4',
    'all-on-6',
    'straumann',
    'nobel biocare',
    'implante dental',
    'implantologia',
    'implante unitario',
    'puente sobre implantes',
  ],
  ortodoncia: [
    'invisalign',
    'ortodoncia',
    'brackets',
    'bracket',
    'alineadores',
    'ortodoncia invisible',
    'ortodoncia transparente',
    'damon',
    'ortopedia',
    'retenedor',
    'aparato dental',
    'aparato ortodoncia',
  ],
  carillas: [
    'carillas',
    'carilla',
    'carillas dentales',
    'carillas porcelana',
    'carillas composite',
    'carillas esteticas',
    'veneers',
    'facetas',
    'estetica dental',
    'diseno sonrisa',
    'diseño de sonrisa',
  ],
  blanqueamiento: [
    'blanqueamiento',
    'blanquear',
    'blanquear dientes',
    'blanqueamiento dental',
    'blanqueamiento laser',
    'dientes blancos',
    'aclaramiento dental',
    'whitening',
  ],
  endodoncia: [
    'endodoncia',
    'matar nervio',
    'tratamiento conducto',
    'conductos',
    'desvitalizar',
    'pulpa dental',
    'tratamiento de conductos',
  ],
  periodoncia: [
    'periodoncia',
    'encias',
    'gingivitis',
    'periodontitis',
    'limpieza periodontal',
    'curetaje',
    'raspado',
    'enfermedad periodontal',
    'encia',
  ],
  urgencias: [
    'urgencia',
    'urgencias',
    'urgencias dentales',
    'dentista urgencias',
    'dolor muela',
    'dolor dental',
    'emergencia dental',
    '24 horas',
    '24h',
    'urgente',
    'dentista urgente',
  ],
  limpieza: [
    'limpieza',
    'limpieza dental',
    'limpieza bucal',
    'higiene dental',
    'higiene bucal',
    'profilaxis',
    'tartrectomia',
    'limpieza profesional',
  ],
  extraccion: [
    'extraccion',
    'extraer',
    'quitar muela',
    'sacar muela',
    'muelas del juicio',
    'cordales',
    'exodoncia',
    'extraccion dental',
    'extraccion muela',
  ],
  cirugia: [
    'cirugia',
    'cirugia oral',
    'cirugia maxilofacial',
    'injerto',
    'elevacion seno',
    'regeneracion osea',
    'cirugia dental',
  ],
  protesis: [
    'protesis',
    'protesis dental',
    'protesis removible',
    'dentadura postiza',
    'dentadura',
    'protesis fija',
    'corona',
    'coronas',
    'puente',
    'puentes',
    'fundas',
  ],
  odontopediatria: [
    'odontopediatria',
    'dentista niños',
    'dentista ninos',
    'dentista infantil',
    'dentista bebes',
    'odontologia infantil',
    'dientes niños',
    'dientes ninos',
  ],
};

/**
 * Tratamientos considerados "core" (alta prioridad)
 */
export const CORE_TREATMENTS = ['implantes', 'ortodoncia'];

/**
 * Detecta el tratamiento dental en una keyword
 * @param keyword - Keyword a clasificar
 * @returns Nombre del tratamiento o null si no se detecta
 */
export function detectTreatment(keyword: string): string | null {
  const normalized = normalize(keyword);

  // Buscar coincidencia con patrones
  for (const [treatment, patterns] of Object.entries(DENTAL_TREATMENTS)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalize(pattern);

      // Match exacto o contenido
      if (normalized === normalizedPattern || normalized.includes(normalizedPattern)) {
        logger.debug(`Treatment detected: ${treatment} (keyword: ${keyword})`);
        return treatment;
      }
    }
  }

  return null;
}

/**
 * Verifica si un tratamiento es "core" (alta prioridad)
 */
export function isCoreTreatment(treatment: string | null): boolean {
  return treatment ? CORE_TREATMENTS.includes(treatment) : false;
}

/**
 * Obtiene todos los tratamientos disponibles
 */
export function getAllTreatments(): string[] {
  return Object.keys(DENTAL_TREATMENTS);
}

export default {
  detectTreatment,
  isCoreTreatment,
  getAllTreatments,
  DENTAL_TREATMENTS,
  CORE_TREATMENTS,
};
