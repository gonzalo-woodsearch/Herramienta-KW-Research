/**
 * Cliente para Google Ads API
 */

import { GoogleAdsApi } from 'google-ads-api';
import config from '../../config.js';
import logger from '../../utils/logger.js';
import { RateLimiter } from '../../utils/rate-limiter.js';

export class GoogleAdsClient {
  private client: GoogleAdsApi;
  private customerId: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: config.googleAds.clientId,
      client_secret: config.googleAds.clientSecret,
      developer_token: config.googleAds.developerToken,
    });

    this.customerId = config.googleAds.customerId;

    this.rateLimiter = new RateLimiter({
      requestsPerMinute: config.googleAds.rateLimit,
    });

    logger.info('Google Ads client initialized', {
      customerId: this.customerId,
    });
  }

  async getCustomer() {
    return this.client.Customer({
      customer_id: this.customerId,
      refresh_token: config.googleAds.refreshToken,
    });
  }

  async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.rateLimiter.acquire();
    return fn();
  }
}

export default GoogleAdsClient;
