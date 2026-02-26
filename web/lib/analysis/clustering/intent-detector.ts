/**
 * Detector de intención: Local y Comercial
 */

import { Intent } from './types';
import { normalize } from './normalizer';
import logger from '../../utils/logger';

/**
 * Principales ciudades españolas
 */
export const SPANISH_CITIES = [
  // Top 20 ciudades
  'madrid',
  'barcelona',
  'valencia',
  'sevilla',
  'zaragoza',
  'malaga',
  'murcia',
  'palma',
  'palma de mallorca',
  'las palmas',
  'las palmas de gran canaria',
  'bilbao',
  'alicante',
  'cordoba',
  'valladolid',
  'vigo',
  'gijon',
  'hospitalet',
  'l hospitalet',
  'vitoria',
  'granada',
  'elche',
  'oviedo',
  'badalona',
  'cartagena',
  'terrassa',
  'sabadell',
  'jerez',
  'santa cruz',
  'pamplona',
  'almeria',
  'fuenlabrada',
  'mostoles',
  'alcala',
  'burgos',
  'albacete',
  'santander',
  'castellon',
  'getafe',
  'logroño',
  'salamanca',
  'tarragona',
  'reus',
  'leon',
  'huelva',
  'lerida',
  'lleida',
  'marbella',
  'badajoz',
  'cadiz',
  'san sebastian',
  'donostia',
];

/**
 * Barrios/distritos famosos de grandes ciudades
 */
export const NEIGHBORHOODS = [
  // Madrid
  'chamberi',
  'salamanca',
  'retiro',
  'arguelles',
  'moncloa',
  'chamartin',
  'tetuan',
  'hortaleza',
  'fuencarral',
  'usera',
  'carabanchel',
  'vallecas',
  // Barcelona
  'eixample',
  'gracia',
  'sarria',
  'sant gervasi',
  'sants',
  'poble sec',
  'barceloneta',
  'raval',
  'gotico',
  'born',
  // Valencia
  'russafa',
  'ruzafa',
  'benimaclet',
  'campanar',
  // General
  'centro',
  'casco antiguo',
  'ensanche',
];

/**
 * Patrones de intención local
 */
export const LOCAL_PATTERNS = [
  'cerca',
  'cerca de mi',
  'cerca mia',
  'near me',
  'cercano',
  'cercana',
  'zona',
  'zona norte',
  'zona sur',
  'zona este',
  'zona oeste',
  'zona centro',
  'abierto',
  'abierto hoy',
  'abierto ahora',
  '24 horas',
  '24h',
  'barrio',
  'distrito',
  'provincia',
  'comunidad',
];

/**
 * Keywords de intención comercial
 */
export const COMMERCIAL_KEYWORDS = [
  // Precio
  'precio',
  'precios',
  'cuanto cuesta',
  'cuanto vale',
  'coste',
  'costes',
  'costo',
  'tarifa',
  'tarifas',
  'presupuesto',
  // Financiación
  'financiacion',
  'financiado',
  'a plazos',
  'sin intereses',
  'cuotas',
  'pagar a plazos',
  'facilidades pago',
  // Ofertas
  'oferta',
  'ofertas',
  'promocion',
  'promociones',
  'descuento',
  'descuentos',
  'barato',
  'barata',
  'economico',
  'economica',
  'primera visita',
  'primera consulta',
  'primera visita gratis',
  'gratis',
  'gratuita',
  // Urgencia
  'urgencias',
  'urgencia',
  'urgente',
  'hoy',
  'hoy mismo',
  'rapido',
  'inmediato',
  // Comparación
  'mejor',
  'mejores',
  'top',
  'recomendado',
  'opiniones',
  'valoraciones',
  'reviews',
];

/**
 * Detecta ciudad en una keyword
 */
export function detectCity(keyword: string): string | undefined {
  const normalized = normalize(keyword);

  // Buscar ciudad exacta o contenida
  for (const city of SPANISH_CITIES) {
    if (normalized.includes(city)) {
      return city;
    }
  }

  // Buscar barrio (menos prioridad)
  for (const neighborhood of NEIGHBORHOODS) {
    if (normalized.includes(neighborhood)) {
      return neighborhood;
    }
  }

  return undefined;
}

/**
 * Detecta si tiene intención local
 */
export function hasLocalIntent(keyword: string): boolean {
  const normalized = normalize(keyword);

  // Verificar ciudad
  if (detectCity(normalized)) {
    return true;
  }

  // Verificar patrones locales
  for (const pattern of LOCAL_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Detecta señales comerciales en una keyword
 */
export function detectCommercialSignals(keyword: string): string[] {
  const normalized = normalize(keyword);
  const signals: string[] = [];

  for (const signal of COMMERCIAL_KEYWORDS) {
    if (normalized.includes(signal)) {
      signals.push(signal);
    }
  }

  return signals;
}

/**
 * Detecta intención completa (local + comercial)
 */
export function detectIntent(keyword: string): Intent {
  const city = detectCity(keyword);
  const local = hasLocalIntent(keyword);
  const commercialSignals = detectCommercialSignals(keyword);

  const intent: Intent = {
    hasLocalIntent: local,
    city,
    hasCommercialIntent: commercialSignals.length > 0,
    commercialSignals,
  };

  logger.debug(`Intent detected for "${keyword}"`, intent);

  return intent;
}

export default {
  detectIntent,
  detectCity,
  hasLocalIntent,
  detectCommercialSignals,
  SPANISH_CITIES,
  LOCAL_PATTERNS,
  COMMERCIAL_KEYWORDS,
};
