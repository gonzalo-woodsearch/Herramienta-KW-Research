/**
 * Detector de intención: Local (con niveles ultra-local) y Comercial
 */

import { Intent, LocalInfo, LocalLevel } from './types';
import { normalize } from './normalizer';
import logger from '../../utils/logger';

// ─── GEOGRAFÍA ESPAÑOLA ────────────────────────────────────────────────────

/** Comunidades autónomas (normalizadas sin tildes) */
const REGIONS: string[] = [
  'andalucia', 'aragon', 'asturias', 'baleares', 'islas baleares',
  'canarias', 'islas canarias', 'cantabria', 'castilla la mancha',
  'castilla y leon', 'cataluna', 'extremadura', 'galicia', 'la rioja',
  'madrid', 'comunidad de madrid', 'murcia', 'region de murcia',
  'navarra', 'pais vasco', 'euskadi', 'comunidad valenciana', 'valencia',
];

/** Provincias (normalizadas) */
const PROVINCES: string[] = [
  // Andalucía
  'almeria', 'cadiz', 'cordoba', 'granada', 'huelva', 'jaen', 'malaga', 'sevilla',
  // Aragón
  'huesca', 'teruel', 'zaragoza',
  // Asturias
  'asturias',
  // Baleares
  'mallorca', 'menorca', 'ibiza', 'formentera',
  // Canarias
  'gran canaria', 'tenerife', 'fuerteventura', 'lanzarote', 'la palma', 'la gomera', 'el hierro',
  // Cantabria
  'cantabria',
  // Castilla-La Mancha
  'albacete', 'ciudad real', 'cuenca', 'guadalajara', 'toledo',
  // Castilla y León
  'avila', 'burgos', 'leon', 'palencia', 'salamanca', 'segovia', 'soria', 'valladolid', 'zamora',
  // Cataluña
  'girona', 'lleida', 'lerida', 'tarragona',
  // Extremadura
  'badajoz', 'caceres',
  // Galicia
  'a coruna', 'lugo', 'ourense', 'pontevedra',
  // Murcia
  'murcia',
  // Navarra
  'navarra',
  // País Vasco
  'alava', 'guipuzcoa', 'vizcaya', 'bizkaia',
  // Comunidad Valenciana
  'alicante', 'castellon',
];

/** Ciudades con su región asociada */
const CITY_REGIONS: Record<string, string> = {
  // Andalucía
  'almeria': 'andalucia', 'algeciras': 'andalucia', 'antequera': 'andalucia',
  'cadiz': 'andalucia', 'cordoba': 'andalucia', 'dos hermanas': 'andalucia',
  'estepona': 'andalucia', 'fuengirola': 'andalucia', 'granada': 'andalucia',
  'huelva': 'andalucia', 'jaen': 'andalucia', 'jerez': 'andalucia',
  'jerez de la frontera': 'andalucia', 'linares': 'andalucia',
  'malaga': 'andalucia', 'marbella': 'andalucia', 'mijas': 'andalucia',
  'motril': 'andalucia', 'roquetas de mar': 'andalucia', 'sevilla': 'andalucia',
  'torremolinos': 'andalucia', 'velez malaga': 'andalucia',
  // Aragón
  'huesca': 'aragon', 'teruel': 'aragon', 'zaragoza': 'aragon',
  // Asturias
  'aviles': 'asturias', 'gijon': 'asturias', 'oviedo': 'asturias',
  // Baleares
  'ibiza': 'baleares', 'palma': 'baleares', 'palma de mallorca': 'baleares',
  'manacor': 'baleares', 'mahon': 'baleares',
  // Canarias
  'arrecife': 'canarias', 'las palmas': 'canarias',
  'las palmas de gran canaria': 'canarias', 'santa cruz de tenerife': 'canarias',
  'santa cruz': 'canarias', 'tenerife': 'canarias', 'puerto de la cruz': 'canarias',
  'la laguna': 'canarias',
  // Cantabria
  'santander': 'cantabria', 'torrelavega': 'cantabria',
  // Castilla-La Mancha
  'albacete': 'castilla la mancha', 'ciudad real': 'castilla la mancha',
  'cuenca': 'castilla la mancha', 'guadalajara': 'castilla la mancha',
  'talavera': 'castilla la mancha', 'toledo': 'castilla la mancha',
  // Castilla y León
  'avila': 'castilla y leon', 'burgos': 'castilla y leon', 'leon': 'castilla y leon',
  'palencia': 'castilla y leon', 'ponferrada': 'castilla y leon',
  'salamanca': 'castilla y leon', 'segovia': 'castilla y leon',
  'soria': 'castilla y leon', 'valladolid': 'castilla y leon', 'zamora': 'castilla y leon',
  // Cataluña
  'badalona': 'cataluna', 'barcelona': 'cataluna', 'cornella': 'cataluna',
  'girona': 'cataluna', 'hospitalet': 'cataluna', 'l hospitalet': 'cataluna',
  'l\'hospitalet': 'cataluna', 'lleida': 'cataluna', 'lerida': 'cataluna',
  'mataro': 'cataluna', 'reus': 'cataluna', 'sabadell': 'cataluna',
  'santa coloma': 'cataluna', 'sant cugat': 'cataluna', 'tarragona': 'cataluna',
  'terrassa': 'cataluna', 'viladecans': 'cataluna',
  // Extremadura
  'badajoz': 'extremadura', 'caceres': 'extremadura', 'merida': 'extremadura',
  // Galicia
  'a coruna': 'galicia', 'coruña': 'galicia', 'ferrol': 'galicia', 'lugo': 'galicia',
  'ourense': 'galicia', 'pontevedra': 'galicia',
  'santiago': 'galicia', 'santiago de compostela': 'galicia', 'vigo': 'galicia',
  // La Rioja
  'logrono': 'la rioja',
  // Madrid (municipios)
  'alcala': 'madrid', 'alcala de henares': 'madrid', 'alcobendas': 'madrid',
  'alcorcon': 'madrid', 'arganda': 'madrid', 'boadilla': 'madrid',
  'boadilla del monte': 'madrid', 'collado villalba': 'madrid',
  'coslada': 'madrid', 'fuenlabrada': 'madrid', 'getafe': 'madrid',
  'las rozas': 'madrid', 'leganes': 'madrid', 'madrid': 'madrid',
  'majadahonda': 'madrid', 'mostoles': 'madrid', 'parla': 'madrid',
  'pozuelo': 'madrid', 'pozuelo de alarcon': 'madrid', 'rivas': 'madrid',
  'rozas': 'madrid', 'san sebastian de los reyes': 'madrid',
  'torrejon': 'madrid', 'torrejon de ardoz': 'madrid', 'tres cantos': 'madrid',
  'valdemoro': 'madrid', 'villalba': 'madrid',
  // Murcia
  'cartagena': 'murcia', 'lorca': 'murcia', 'murcia': 'murcia',
  'san javier': 'murcia', 'molina de segura': 'murcia',
  // Navarra
  'pamplona': 'navarra', 'tudela': 'navarra', 'irunea': 'navarra',
  // País Vasco
  'barakaldo': 'pais vasco', 'bilbao': 'pais vasco', 'donostia': 'pais vasco',
  'eibar': 'pais vasco', 'irun': 'pais vasco', 'san sebastian': 'pais vasco',
  'vitoria': 'pais vasco', 'gasteiz': 'pais vasco',
  // Comunidad Valenciana
  'alicante': 'valencia', 'alcoy': 'valencia', 'benidorm': 'valencia',
  'castellon': 'valencia', 'elche': 'valencia', 'gandia': 'valencia',
  'orihuela': 'valencia', 'torrevieja': 'valencia', 'valencia': 'valencia',
  'vila-real': 'valencia',
};

const CITY_LIST: string[] = Object.keys(CITY_REGIONS).sort((a, b) => b.length - a.length);

/** Barrios organizados por ciudad (normalizados sin tildes) */
const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  madrid: [
    'chamberi', 'salamanca', 'retiro', 'arguelles', 'moncloa', 'chamartin',
    'tetuan', 'hortaleza', 'fuencarral', 'usera', 'carabanchel', 'vallecas',
    'villaverde', 'moratalaz', 'ciudad lineal', 'barajas', 'san blas',
    'puente de vallecas', 'villa de vallecas', 'vicalvaro', 'latina',
    'embajadores', 'cortes', 'justicia', 'universidad', 'sol',
    'lavapies', 'huertas', 'pacifico', 'chueca', 'malasana',
    'prosperidad', 'guindalera', 'jeronimos',
    'atocha', 'estrella', 'chopera', 'acacias', 'imperial', 'delicias',
    'entrevias', 'numancia', 'pradolongo', 'moscardo',
    'sanchinarro', 'las tablas', 'montecarmelo', 'arroyo del fresno',
    'pilar', 'mirasierra', 'pinar del rey', 'virgen del cortijo',
    'palomas', 'canillas', 'ventas', 'quintana', 'concepcion',
    'san pascual', 'goya', 'recoletos', 'castellana',
  ],
  barcelona: [
    'eixample', 'gracia', 'sarria', 'sant gervasi', 'sants', 'poble sec',
    'barceloneta', 'raval', 'gotico', 'born', 'poblenou', 'glories',
    'diagonal', 'les corts', 'sant marti', 'horta', 'guinardo',
    'nou barris', 'sant andreu', 'clot', 'sagrada familia',
    'dreta eixample', 'esquerra eixample', 'sant pere', 'santa caterina',
    'pedralbes', 'vallvidrera', 'tibidabo', 'zona alta', 'via augusta',
    'bonanova', 'galvany', 'verdaguer', 'tetuan',
  ],
  valencia: [
    'russafa', 'ruzafa', 'benimaclet', 'campanar', 'patraix', 'jesus',
    'quatre carreres', 'zaidia', 'extramurs', 'el pla del real',
    'olivereta', 'poblats maritims', 'camins al grau', 'algiros',
    'benicalap', 'malvarosa', 'cabanyal', 'canyamelar',
    'arrancapins', 'pla del remei', 'el carmen', 'la xerea',
  ],
  sevilla: [
    'triana', 'macarena', 'nervion', 'los remedios', 'heliopolis',
    'casco antiguo', 'santa cruz', 'bellavista', 'palmete', 'cerro amate',
    'sur', 'este', 'norte', 'pino montano', 'torreblanca',
  ],
  malaga: [
    'centro', 'teatinos', 'churriana', 'campanillas', 'cruz de humilladero',
    'carranque', 'ciudad jardin', 'malagueta', 'soho', 'lagunillas',
    'pedregalejo', 'el palo', 'huelin', 'la merced',
  ],
  bilbao: [
    'casco viejo', 'abando', 'begona', 'deusto', 'basurto',
    'otxarkoaga', 'uribarri', 'rekalde', 'san francisco',
    'indautxu', 'amezola', 'santutxu', 'irala', 'iturrigorri',
  ],
  zaragoza: [
    'delicias', 'san jose', 'romareda', 'torrero', 'casablanca', 'actur',
    'la jota', 'oliver', 'valdefierro', 'las fuentes', 'la almozara',
    'casco historico', 'miralbueno',
  ],
  alicante: [
    'carolinas', 'san blas', 'ciudad jardin', 'playa san juan',
    'cabo de las huertas', 'vistahermosa', 'el portalet',
  ],
  granada: [
    'albaicin', 'realejo', 'centro', 'genil', 'sacromonte',
    'beiro', 'ronda', 'chana', 'norte', 'huetor vega',
  ],
  murcia: [
    'centro', 'santa maria de gracia', 'esparragal', 'infante',
    'san andres', 'vistabella', 'vistalegre',
  ],
  cordoba: [
    'centro', 'campo de la verdad', 'fray albino', 'poniente norte',
    'chinales', 'casco historico', 'cañero',
  ],
};

/** Todos los barrios (flatten) con referencia a la ciudad */
const NEIGHBORHOOD_TO_CITY: Record<string, string> = {};
for (const [city, hoods] of Object.entries(NEIGHBORHOODS_BY_CITY)) {
  for (const hood of hoods) {
    NEIGHBORHOOD_TO_CITY[hood] = city;
  }
}
const ALL_NEIGHBORHOODS: string[] = Object.keys(NEIGHBORHOOD_TO_CITY).sort(
  (a, b) => b.length - a.length
);

// ─── PATRONES ─────────────────────────────────────────────────────────────

/** Patrones ultra-locales: máxima intención de cercanía física */
const ULTRALOCAL_PATTERNS: string[] = [
  'cerca de mi', 'cerca mia', 'near me', 'a domicilio', 'en mi barrio',
  'al lado de mi', 'al lado', 'muy cerca', 'aqui cerca',
  'en mi zona', 'en mi calle', 'proximo a mi',
];

/** Patrones locales genéricos */
const LOCAL_PATTERNS: string[] = [
  'cerca', 'cercano', 'cercana', 'cercanias',
  'zona norte', 'zona sur', 'zona este', 'zona oeste', 'zona centro',
  'abierto hoy', 'abierto ahora', 'abierto 24',
  '24 horas', '24h',
  'barrio', 'distrito', 'provincia',
];

/** Keywords de intención comercial */
const COMMERCIAL_KEYWORDS: string[] = [
  // Precio
  'precio', 'precios', 'cuanto cuesta', 'cuanto vale', 'coste', 'costes', 'costo',
  'tarifa', 'tarifas', 'presupuesto', 'cuanto cobran',
  // Financiación
  'financiacion', 'financiado', 'a plazos', 'sin intereses', 'cuotas',
  'pagar a plazos', 'facilidades pago', 'financiar',
  // Ofertas
  'oferta', 'ofertas', 'promocion', 'promociones', 'descuento', 'descuentos',
  'barato', 'barata', 'economico', 'economica', 'primera visita',
  'primera consulta', 'primera visita gratis', 'gratis', 'gratuita',
  'mas barato', 'mejor precio',
  // Urgencia transaccional
  'urgencias', 'urgencia', 'urgente', 'hoy mismo', 'rapido', 'inmediato',
  'cita hoy', 'cita urgente',
  // Comparación
  'mejor', 'mejores', 'top', 'recomendado', 'recomendada',
  'opiniones', 'valoraciones', 'reviews', 'clinica buena',
];

// ─── FUNCIONES DE DETECCIÓN ────────────────────────────────────────────────

function findNeighborhood(norm: string): string | undefined {
  return ALL_NEIGHBORHOODS.find(hood => norm.includes(hood));
}

function findCity(norm: string): string | undefined {
  return CITY_LIST.find(city => norm.includes(city));
}

/**
 * Detecta el nivel de localidad y extrae información geográfica
 */
export function detectLocalInfo(keyword: string): LocalInfo {
  const norm = normalize(keyword);

  // Nivel 5 - Ultra-local: "cerca de mi", "a domicilio", etc.
  for (const pattern of ULTRALOCAL_PATTERNS) {
    if (norm.includes(pattern)) {
      const city = findCity(norm);
      const neighborhood = findNeighborhood(norm);
      return {
        level: 'ultralocal',
        city: city,
        neighborhood,
        region: city ? CITY_REGIONS[city] : undefined,
        localScore: 5,
      };
    }
  }

  // Nivel 4 - Barrio específico
  const neighborhood = findNeighborhood(norm);
  if (neighborhood) {
    const cityFromHood = NEIGHBORHOOD_TO_CITY[neighborhood];
    return {
      level: 'neighborhood',
      city: cityFromHood,
      neighborhood,
      region: CITY_REGIONS[cityFromHood],
      localScore: 4,
    };
  }

  // Nivel 3 - Ciudad concreta
  const city = findCity(norm);
  if (city) {
    return {
      level: 'city',
      city,
      region: CITY_REGIONS[city],
      localScore: 3,
    };
  }

  // Nivel 2 - Provincia
  for (const province of PROVINCES) {
    if (norm.includes(province)) {
      return {
        level: 'regional',
        region: province,
        localScore: 2,
      };
    }
  }

  // Nivel 1 - Comunidad autónoma o patrón local genérico
  for (const region of REGIONS) {
    if (norm.includes(region)) {
      return {
        level: 'regional',
        region,
        localScore: 1,
      };
    }
  }

  for (const pattern of LOCAL_PATTERNS) {
    if (norm.includes(pattern)) {
      return {
        level: 'national',
        localScore: 1,
      };
    }
  }

  return { level: 'none', localScore: 0 };
}

/**
 * Detecta señales comerciales en una keyword
 */
export function detectCommercialSignals(keyword: string): string[] {
  const norm = normalize(keyword);
  return COMMERCIAL_KEYWORDS.filter(signal => norm.includes(signal));
}

/**
 * Detecta intención completa (local + comercial)
 */
export function detectIntent(keyword: string): Intent {
  const localInfo = detectLocalInfo(keyword);
  const commercialSignals = detectCommercialSignals(keyword);

  const intent: Intent = {
    hasLocalIntent: localInfo.level !== 'none',
    localLevel: localInfo.level,
    city: localInfo.city,
    neighborhood: localInfo.neighborhood,
    region: localInfo.region,
    localScore: localInfo.localScore,
    hasCommercialIntent: commercialSignals.length > 0,
    commercialSignals,
  };

  logger.debug(`Intent detected for "${keyword}"`, {
    level: localInfo.level,
    city: localInfo.city,
    neighborhood: localInfo.neighborhood,
    score: localInfo.localScore,
  });

  return intent;
}

// Legacy exports for compatibility
export function detectCity(keyword: string): string | undefined {
  return detectLocalInfo(keyword).city;
}

export function hasLocalIntent(keyword: string): boolean {
  return detectLocalInfo(keyword).level !== 'none';
}

export const SPANISH_CITIES = CITY_LIST;
export { LOCAL_PATTERNS, COMMERCIAL_KEYWORDS };

export default {
  detectIntent,
  detectLocalInfo,
  detectCity,
  hasLocalIntent,
  detectCommercialSignals,
  SPANISH_CITIES: CITY_LIST,
  LOCAL_PATTERNS,
  COMMERCIAL_KEYWORDS,
};
