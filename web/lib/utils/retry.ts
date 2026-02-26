/**
 * Sistema de retry con backoff exponencial
 */

import logger from './logger.js';

export interface RetryOptions {
  attempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  attempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.attempts) {
        logger.error(`All ${opts.attempts} retry attempts failed`, error);
        throw error;
      }

      const delayMs = opts.delayMs * Math.pow(opts.backoffMultiplier || 2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });

      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
}

export default retry;
