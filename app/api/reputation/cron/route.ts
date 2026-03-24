/**
 * CRON Job de reputacao desativado.
 *
 * Política atual: modo API-only, zero scraping.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * CRON endpoint - somente GET
 * 
 * Vercel CRON automaticamente chama este endpoint
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - CRON secret invalido' },
        { status: 401 }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      mode: 'api-only',
      message: 'Rota desativada: politica zero-scraping habilitada.',
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}
