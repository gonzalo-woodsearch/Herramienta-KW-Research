import { NextRequest, NextResponse } from 'next/server';
import { siteExplorerService } from '@/lib/api/ahrefs/site-explorer';
import config from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!config.ahrefs.apiKey) {
      return NextResponse.json({ error: 'AHREFS_NOT_CONFIGURED' }, { status: 503 });
    }

    const body = await request.json();
    const { url, country = 'ES' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const stats = await siteExplorerService.getDomainStats(url, country);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[domain-stats] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error fetching domain stats' },
      { status: 500 }
    );
  }
}
