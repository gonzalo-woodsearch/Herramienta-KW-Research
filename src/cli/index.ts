#!/usr/bin/env node

/**
 * CLI Entry Point
 * kwtool - Keyword Research Tool for Dental Clinics (Spain)
 */

import { Command } from 'commander';
import { processUrl } from './commands/url.js';
import { UrlCommandOptions } from '../types.js';
import { UrlCommandCliOptions } from './types.js';
import cache from '../api/cache.js';

const program = new Command();

program
  .name('kwtool')
  .description('Keyword research tool for dental clinics using Ahrefs + Google Ads API')
  .version('1.0.0');

// Command: url
program
  .command('url')
  .description('Analyze organic keywords for a given URL')
  .requiredOption('--url <url>', 'URL to analyze (must be exact URL from Ahrefs)')
  .option('--country <country>', 'Country code for targeting (default: ES)', 'ES')
  .option('--lang <lang>', 'Language code for Google Ads (default: es)', 'es')
  .option('--limit <number>', 'Maximum number of keywords to fetch', '100')
  .option('--out <directory>', 'Output directory for results', './output')
  .action(async (options: UrlCommandCliOptions) => {
    try {
      const urlOptions: UrlCommandOptions = {
        url: options.url,
        country: options.country || 'ES',
        lang: options.lang || 'es',
        limit: parseInt(options.limit || '100', 10),
        out: options.out || './output',
      };

      await processUrl(urlOptions);
    } catch (error) {
      console.error('Command failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Command: cache
program
  .command('cache')
  .description('Manage cache')
  .option('--clear', 'Clear all cache')
  .option('--stats', 'Show cache statistics')
  .action((options) => {
    if (options.clear) {
      cache.clear();
      console.log('✅ Cache cleared');
    }

    if (options.stats) {
      const stats = cache.getStats();
      console.log('\n📊 Cache Statistics:');
      console.log(`   Hits: ${stats.hits}`);
      console.log(`   Misses: ${stats.misses}`);
      console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
      console.log(`   Size: ${stats.size} entries\n`);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (process.argv.length === 2) {
  program.help();
}
