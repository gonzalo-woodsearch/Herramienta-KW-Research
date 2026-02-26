/**
 * Ahrefs Site Explorer - Domain analysis service
 */

import AhrefsClient from './client';
import cache from '../cache';
import config from '../../config';
import logger from '../../utils/logger';

export interface DomainMetrics {
  orgTraffic: number;
  orgKeywords: number;
  trafficValueUsd: number;
}

export interface BacklinksStats {
  live: number;
  allTime: number;
  liveRefdomains: number;
  allTimeRefdomains: number;
  newLast30: number;
  lostLast30: number;
}

export interface TopPage {
  url: string;
  traffic: number;
  keywords: number;
  topKeyword?: string;
  topKeywordPosition?: number;
  ur?: number;
  referringDomains?: number;
}

export interface ReferringDomain {
  domain: string;
  domainRating: number;
  linksToTarget: number;
  trafficDomain: number;
}

export interface SubfolderStat {
  path: string;
  traffic: number;
  pages: number;
}

export interface DomainStats {
  domain: string;
  domainRating: number;
  metrics: DomainMetrics;
  backlinks: BacklinksStats;
  topPages: TopPage[];
  referringDomains: ReferringDomain[];
  subfolders: SubfolderStat[];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoStr(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function computeSubfolders(pages: TopPage[]): SubfolderStat[] {
  const map = new Map<string, { traffic: number; pages: number }>();
  for (const page of pages) {
    try {
      const u = new URL(page.url.startsWith('http') ? page.url : `https://${page.url}`);
      const segments = u.pathname.split('/').filter(Boolean);
      const path = segments.length > 0 ? `/${segments[0]}` : '/';
      const existing = map.get(path) || { traffic: 0, pages: 0 };
      map.set(path, { traffic: existing.traffic + page.traffic, pages: existing.pages + 1 });
    } catch {
      const existing = map.get('/') || { traffic: 0, pages: 0 };
      map.set('/', { traffic: existing.traffic + page.traffic, pages: existing.pages + 1 });
    }
  }
  return Array.from(map.entries())
    .map(([path, stat]) => ({ path, ...stat }))
    .sort((a, b) => b.traffic - a.traffic);
}

export class SiteExplorerService {
  private client: AhrefsClient;

  constructor() {
    this.client = new AhrefsClient();
  }

  private async fetchMetrics(domain: string, country: string): Promise<{
    org_traffic?: number;
    org_keywords?: number;
    org_cost?: number;
  }> {
    return this.client.request('/site-explorer/metrics', {
      target: domain,
      date: todayStr(),
      country: country.toUpperCase(),
      mode: 'subdomains',
    });
  }

  private async fetchBacklinksStats(domain: string, date: string): Promise<{
    live?: number;
    all_time?: number;
    live_refdomains?: number;
    all_time_refdomains?: number;
  }> {
    return this.client.request('/site-explorer/backlinks-stats', {
      target: domain,
      date,
      mode: 'subdomains',
    });
  }

  private async fetchDomainRating(domain: string): Promise<{ domain_rating?: number }> {
    try {
      return await this.client.request('/site-explorer/domain-rating', {
        target: domain,
        date: todayStr(),
      });
    } catch {
      return {};
    }
  }

  private async fetchTopPages(domain: string, country: string): Promise<Array<{
    url?: string;
    sum_traffic?: number;
    keywords?: number;
    top_keyword?: string;
    top_keyword_best_position?: number;
    ur?: number;
    referring_domains?: number;
  }>> {
    const response = await this.client.request<{ pages?: unknown[] }>('/site-explorer/top-pages', {
      target: domain,
      date: todayStr(),
      country: country.toUpperCase(),
      mode: 'subdomains',
      select: 'url,sum_traffic,keywords,top_keyword,top_keyword_best_position,ur,referring_domains',
      order_by: 'sum_traffic:desc',
      limit: 20,
    });
    if (response && Array.isArray((response as any).pages)) {
      return (response as any).pages;
    }
    if (Array.isArray(response)) return response as any[];
    return [];
  }

  private async fetchReferringDomains(domain: string): Promise<Array<{
    domain?: string;
    domain_rating?: number;
    links_to_target?: number;
    traffic_domain?: number;
  }>> {
    const response = await this.client.request<{ refdomains?: unknown[] }>('/site-explorer/referring-domains', {
      target: domain,
      mode: 'subdomains',
      history: 'live',
      select: 'domain,domain_rating,links_to_target,traffic_domain',
      order_by: 'domain_rating:desc',
      limit: 15,
    });
    if (response && Array.isArray((response as any).refdomains)) {
      return (response as any).refdomains;
    }
    if (Array.isArray(response)) return response as any[];
    return [];
  }

  async getDomainStats(targetUrl: string, country = 'ES'): Promise<DomainStats> {
    const domain = extractDomain(targetUrl);
    const cacheKey = `ahrefs:domain-stats:${domain}:${country}`;

    const cached = cache.get<DomainStats>(cacheKey);
    if (cached) {
      logger.info(`Using cached domain stats for ${domain}`);
      return cached;
    }

    logger.info(`Fetching domain stats from Ahrefs for ${domain}`);
    const thirtyDaysAgo = daysAgoStr(30);

    const [metricsRes, blCurrentRes, bl30Res, drRes, pagesRes, refDomainsRes] = await Promise.allSettled([
      this.fetchMetrics(domain, country),
      this.fetchBacklinksStats(domain, todayStr()),
      this.fetchBacklinksStats(domain, thirtyDaysAgo),
      this.fetchDomainRating(domain),
      this.fetchTopPages(domain, country),
      this.fetchReferringDomains(domain),
    ]);

    const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : {};
    const blCurrent = blCurrentRes.status === 'fulfilled' ? blCurrentRes.value : {};
    const bl30 = bl30Res.status === 'fulfilled' ? bl30Res.value : {};
    const dr = drRes.status === 'fulfilled' ? drRes.value : {};
    const pagesRaw = pagesRes.status === 'fulfilled' ? pagesRes.value : [];
    const refRaw = refDomainsRes.status === 'fulfilled' ? refDomainsRes.value : [];

    const topPages: TopPage[] = pagesRaw.map(p => ({
      url: p.url || '',
      traffic: p.sum_traffic || 0,
      keywords: p.keywords || 0,
      topKeyword: p.top_keyword,
      topKeywordPosition: p.top_keyword_best_position,
      ur: p.ur,
      referringDomains: p.referring_domains,
    }));

    const liveCurrent = blCurrent.live || 0;
    const livePrev = bl30.live || 0;
    const refdsCurrent = blCurrent.live_refdomains || 0;
    const refdsPrev = bl30.live_refdomains || 0;

    const stats: DomainStats = {
      domain,
      domainRating: Math.round(dr.domain_rating || 0),
      metrics: {
        orgTraffic: metrics.org_traffic || 0,
        orgKeywords: metrics.org_keywords || 0,
        trafficValueUsd: Math.round((metrics.org_cost || 0) / 100),
      },
      backlinks: {
        live: liveCurrent,
        allTime: blCurrent.all_time || 0,
        liveRefdomains: refdsCurrent,
        allTimeRefdomains: blCurrent.all_time_refdomains || 0,
        newLast30: Math.max(0, liveCurrent - livePrev),
        lostLast30: Math.max(0, livePrev - liveCurrent),
      },
      topPages,
      referringDomains: refRaw.map(r => ({
        domain: r.domain || '',
        domainRating: Math.round(r.domain_rating || 0),
        linksToTarget: r.links_to_target || 0,
        trafficDomain: r.traffic_domain || 0,
      })),
      subfolders: computeSubfolders(topPages),
    };

    cache.set(cacheKey, stats, config.ahrefs.cacheTtl);
    return stats;
  }
}

export const siteExplorerService = new SiteExplorerService();
export default siteExplorerService;
