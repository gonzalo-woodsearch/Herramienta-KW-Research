/**
 * Cliente base para Ahrefs API v3
 */

import fetch from 'node-fetch';
import config from '../../config';
import logger from '../../utils/logger';
import { retry } from '../../utils/retry';
import { RateLimiter } from '../../utils/rate-limiter';

const AHREFS_API_BASE = 'https://api.ahrefs.com/v3';

export class AhrefsClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.apiKey = config.ahrefs.apiKey;
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: config.ahrefs.rateLimit,
    });
  }

  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    await this.rateLimiter.acquire();

    return retry(async () => {
      const url = `${AHREFS_API_BASE}${endpoint}`;

      logger.debug(`Ahrefs API request: ${method} ${endpoint}`, body);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Ahrefs API error: ${response.status} ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          // Si no es JSON, usar el texto como está
          errorMessage = errorText || errorMessage;
        }

        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      logger.debug(`Ahrefs API response received`);

      return data as T;
    }, {
      attempts: 3,
      delayMs: 1000,
    });
  }
}

export default AhrefsClient;
