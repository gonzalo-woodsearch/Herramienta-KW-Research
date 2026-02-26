/**
 * Sistema de boosts para scoring - con boosts diferenciados por nivel local
 */

import { Keyword } from '../../types';
import { isCoreTreatment } from '../clustering/dental-classifier';
import logger from '../../utils/logger';

// Boost por nivel de intención local (localScore 0-5)
const LOCAL_BOOSTS: Record<number, number> = {
  5: 25, // ultralocal: "implantes cerca de mi"
  4: 20, // barrio: "dentista chamberi"
  3: 15, // ciudad: "clinica dental madrid"
  2: 8,  // regional: "implantes comunidad de madrid"
  1: 3,  // nacional/genérico: "dentista cerca"
  0: 0,
};

const BOOST_CONFIG = {
  coreTreatment: 10,
  commercialSignals: 5,
};

/** Señales comerciales que otorgan boost */
const PRIORITY_COMMERCIAL_SIGNALS = [
  'precio', 'financiacion', 'urgencias', 'urgencia', 'cuanto cuesta', 'mas barato',
];

/**
 * Calcula los boosts aplicables a una keyword
 */
export function calculateBoosts(kw: Keyword): number {
  let totalBoosts = 0;
  const boostReasons: string[] = [];

  // Boost 1: Intención local diferenciada por nivel (0-25 puntos)
  const localScore = (kw.localScore ?? 0) as number;
  const localBoost = LOCAL_BOOSTS[localScore] ?? 0;
  if (localBoost > 0) {
    totalBoosts += localBoost;
    const level = kw.localLevel || 'local';
    const location = (kw.neighborhood || kw.city || kw.region) ?? '';
    boostReasons.push(`+${localBoost} (${level}${location ? ': ' + location : ''})`);
  }

  // Boost 2: Tratamiento core (implantes o ortodoncia)
  if (isCoreTreatment(kw.treatment || null)) {
    totalBoosts += BOOST_CONFIG.coreTreatment;
    boostReasons.push(`+${BOOST_CONFIG.coreTreatment} (tratamiento core: ${kw.treatment})`);
  }

  // Boost 3: Señales comerciales prioritarias
  if (kw.hasCommercialIntent && kw.commercialSignals) {
    const hasPrioritySignal = kw.commercialSignals.some(signal =>
      PRIORITY_COMMERCIAL_SIGNALS.includes(signal)
    );
    if (hasPrioritySignal) {
      totalBoosts += BOOST_CONFIG.commercialSignals;
      boostReasons.push(
        `+${BOOST_CONFIG.commercialSignals} (comercial: ${kw.commercialSignals.slice(0, 2).join(', ')})`
      );
    }
  }

  if (totalBoosts > 0) {
    logger.debug(`Boosts for "${kw.keyword}": ${totalBoosts} (${boostReasons.join(', ')})`);
  }

  return totalBoosts;
}

export default calculateBoosts;
