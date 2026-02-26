import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl, AnalysisRequest } from '@/lib/analyze';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max (Vercel hobby limit)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalysisRequest;

    // Validate input
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate limit
    const limit = body.limit || 50;
    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      );
    }

    console.log(`[API] Received analysis request for ${body.url} (limit: ${limit})`);

    // Execute analysis
    const result = await analyzeUrl({
      url: body.url,
      country: body.country || 'ES',
      lang: body.lang || 'es',
      limit,
    });

    console.log(`[API] Analysis complete. Returning ${result.keywords.length} keywords`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error during analysis:', error);

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'KW Research API - POST to /api/analyze with { url, country?, lang?, limit? }',
    version: '1.0.0',
  });
}
