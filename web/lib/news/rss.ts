import { NewsItem } from './types';

interface RSSSource {
  url: string;
  name: string;
}

// ─── RSS Sources by category ─────────────────────────────────────────────────

export const RSS_SOURCES: Record<string, RSSSource[]> = {
  'ia-general': [
    { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI' },
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
    { url: 'https://feeds.feedburner.com/oreilly/radar/atom', name: "O'Reilly Radar" },
  ],
  'ia-marketing': [
    { url: 'https://marketingaiinstitute.com/blog/rss.xml', name: 'Marketing AI Institute' },
    { url: 'https://martech.org/feed/', name: 'Martech' },
    { url: 'https://searchengineland.com/category/marketing/feed/', name: 'SEL Marketing' },
  ],
  'ia-tools': [
    { url: 'https://www.geeky-gadgets.com/category/ai/feed/', name: 'Geeky Gadgets AI' },
    { url: 'https://thenewstack.io/category/ai/feed/', name: 'The New Stack AI' },
    { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  ],
  'ia-seo-local': [
    { url: 'https://moz.com/feeds/blog', name: 'Moz Blog' },
    { url: 'https://ahrefs.com/blog/feed/', name: 'Ahrefs Blog' },
    { url: 'https://searchengineland.com/category/seo/feed/', name: 'SEL SEO' },
  ],
  'seo-general': [
    { url: 'https://www.brightlocal.com/learn/feed/', name: 'BrightLocal' },
    { url: 'https://localu.org/feed/', name: 'Local University' },
    { url: 'https://searchengineland.com/category/local/feed/', name: 'SEL Local' },
  ],
  'seo-google': [
    { url: 'https://developers.google.com/search/blog/rss.xml', name: 'Google Search Central' },
    { url: 'https://searchengineland.com/category/google/feed/', name: 'SEL Google' },
    { url: 'https://www.seroundtable.com/google/feed', name: 'Search Engine Roundtable' },
  ],
};

// ─── Simple RSS XML Parser ─────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  // Normal tag
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(re);
  if (match) return match[1].replace(/<[^>]+>/g, '').trim();
  return '';
}

function parseRSSItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Find all <item> or <entry> blocks
  const itemPattern = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, 'title') || 'Sin título';
    const description = extractTag(block, 'description') ||
                        extractTag(block, 'summary') ||
                        extractTag(block, 'content') || '';

    // Extract URL
    let url = '';
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/) ||
                      block.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) ||
                      block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/);
    if (linkMatch) url = linkMatch[1].trim();

    // Extract date
    let publishedAt = '';
    const pubDateMatch = block.match(/<(?:pubDate|published|updated)[^>]*>([^<]+)<\/(?:pubDate|published|updated)>/i);
    if (pubDateMatch) {
      try {
        publishedAt = new Date(pubDateMatch[1].trim()).toISOString();
      } catch {
        publishedAt = new Date().toISOString();
      }
    } else {
      publishedAt = new Date().toISOString();
    }

    if (title && url) {
      items.push({
        title: title.substring(0, 200),
        url,
        description: description.substring(0, 500),
        source: sourceName,
        publishedAt,
      });
    }
  }

  return items;
}

// ─── Fetch one RSS feed ────────────────────────────────────────────────────

async function fetchFeed(source: RSSSource, timeoutMs = 8000): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KWResearchBot/1.0)' },
      next: { revalidate: 3600 },
    });

    clearTimeout(timer);

    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, source.name);
  } catch {
    return [];
  }
}

// ─── Fetch all feeds for a category ────────────────────────────────────────

export async function fetchCategory(categoryId: string, limit = 10): Promise<NewsItem[]> {
  const sources = RSS_SOURCES[categoryId] || [];
  const results = await Promise.allSettled(sources.map(s => fetchFeed(s)));

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  // Sort by date descending, dedupe by URL, limit
  const seen = new Set<string>();
  return all
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .slice(0, limit);
}
