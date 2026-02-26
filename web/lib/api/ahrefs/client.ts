/**
 * Cliente base para Ahrefs API v3
 * Usa GET con query parameters según la especificación de la API v3
 */

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
    params: Record<string, string | number | undefined>
  ): Promise<T> {
    await this.rateLimiter.acquire();

    return retry(async () => {
      const url = new URL(`${AHREFS_API_BASE}${endpoint}`);

      // Añadir query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      logger.debug(`Ahrefs API GET ${endpoint}`, params);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Ahrefs API error: ${response.status} ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.error?.message || errorMessage;
        } catch {
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
