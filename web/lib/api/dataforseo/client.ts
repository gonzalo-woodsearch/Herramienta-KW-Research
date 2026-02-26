/**
 * Cliente base para DataForSEO API
 * Usa Basic Auth con email:password
 */

import config from '../../config';
import logger from '../../utils/logger';
import { retry } from '../../utils/retry';
import { RateLimiter } from '../../utils/rate-limiter';

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

export class DataForSEOClient {
  private authHeader: string;
  private rateLimiter: RateLimiter;

  constructor() {
    const credentials = `${config.dataforseo.login}:${config.dataforseo.password}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 60,
    });
  }

  async post<T>(endpoint: string, body: unknown[]): Promise<T> {
    await this.rateLimiter.acquire();

    return retry(async () => {
      const url = `${DATAFORSEO_API_BASE}${endpoint}`;

      logger.debug(`DataForSEO POST ${endpoint}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as T;
      return data;
    }, {
      attempts: 3,
      delayMs: 1000,
    });
  }
}

export default DataForSEOClient;
