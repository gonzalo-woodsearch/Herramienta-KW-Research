/**
 * Rate limiter usando token bucket algorithm
 */

import logger from './logger.js';

export interface RateLimiterOptions {
  requestsPerMinute: number;
}

export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  private lastRefill: number;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.requestsPerMinute;
    this.tokens = this.maxTokens;
    this.refillRate = options.requestsPerMinute / 60000; // tokens per ms
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // No hay tokens disponibles, esperar hasta que haya uno
    const timeToWait = (1 - this.tokens) / this.refillRate;
    logger.debug(`Rate limit reached, waiting ${Math.round(timeToWait)}ms`);

    await new Promise(resolve => setTimeout(resolve, timeToWait));

    this.refill();
    this.tokens -= 1;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

export default RateLimiter;
