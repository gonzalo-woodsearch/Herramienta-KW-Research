/**
 * Sistema de boosts para scoring
 */

import { Keyword } from '../../types';
import { isCoreTreatment } from '../clustering/dental-classifier';
import logger from '../../utils/logger';

const BOOST_CONFIG = {
  localWithCity: 10,
  coreTreatment: 10,
  commercialSignals: 5,
};

/**
 * Señales comerciales que otorgan boost
 */
const PRIORITY_COMMERCIAL_SIGNALS = ['precio', 'financiacion', 'urgencias', 'urgencia'];

/**
 * Calcula los boosts aplicables a una keyword
 */
export function calculateBoosts(kw: Keyword): number {
  let totalBoosts = 0;
  const boostReasons: string[] = [];

  // Boost 1: Local + Ciudad específica
  if (kw.hasLocalIntent && kw.city) {
    totalBoosts += BOOST_CONFIG.localWithCity;
    boostReasons.push(`+${BOOST_CONFIG.localWithCity} (local + ciudad: ${kw.city})`);
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
        `+${BOOST_CONFIG.commercialSignals} (comercial: ${kw.commercialSignals.join(', ')})`
      );
    }
  }

  if (totalBoosts > 0) {
    logger.debug(`Boosts for "${kw.keyword}": ${totalBoosts} (${boostReasons.join(', ')})`);
  }

  return totalBoosts;
}

export default calculateBoosts;
