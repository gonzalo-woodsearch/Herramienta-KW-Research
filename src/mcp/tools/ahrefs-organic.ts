/**
 * MCP Tool: ahrefsOrganicKeywordsByUrl
 */

import { organicKeywordsService } from '../../api/ahrefs/organic-keywords.js';
import { AhrefsOrganicInput } from '../types.js';

export async function ahrefsOrganicKeywordsByUrl(input: AhrefsOrganicInput) {
  const { url, country = 'es', limit = 100 } = input;

  const keywords = await organicKeywordsService.getOrganicKeywords(url, country, limit);

  return {
    success: true,
    count: keywords.length,
    keywords,
  };
}

export default ahrefsOrganicKeywordsByUrl;
