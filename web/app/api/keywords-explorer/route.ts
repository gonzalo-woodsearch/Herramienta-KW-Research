import { NextRequest, NextResponse } from 'next/server';
import { keywordsExplorerService } from '@/lib/api/ahrefs/keywords-explorer';
import config from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!config.dataforseo.login || !config.dataforseo.password) {
      return NextResponse.json({ error: 'DATAFORSEO_NOT_CONFIGURED' }, { status: 503 });
    }

    const body = await request.json();
    const { keyword, country = 'ES', limit = 50 } = body;

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    if (limit < 1 || limit > 200) {
      return NextResponse.json({ error: 'Limit must be between 1 and 200' }, { status: 400 });
    }

    console.log(`[keywords-explorer] Searching "${keyword}" in ${country} (limit: ${limit})`);

    const result = await keywordsExplorerService.explore(keyword.trim(), country, limit);

    console.log(`[keywords-explorer] Found ${result.keywords.length} keyword ideas`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[keywords-explorer] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error fetching keyword ideas' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Keywords Explorer API - POST with { keyword, country?, limit? }',
    version: '1.0.0',
  });
}
