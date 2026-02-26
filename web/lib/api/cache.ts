/**
 * Sistema de cache en memoria con TTL
 */

import { CacheEntry } from '../types.js';
import logger from '../utils/logger.js';

export class Cache {
  private store: Map<string, CacheEntry<any>>;
  private hits: number;
  private misses: number;

  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl * 1000;

    if (isExpired) {
      this.store.delete(key);
      this.misses++;
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.hits++;
    logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    };

    this.store.set(key, entry);
    logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
  }

  invalidate(pattern: string): number {
    let deleted = 0;

    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info(`Cache invalidated: ${deleted} entries matching "${pattern}"`);
    }

    return deleted;
  }

  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    logger.info(`Cache cleared: ${size} entries removed`);
  }

  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}

// Instancia global de cache
export const cache = new Cache();
export default cache;
