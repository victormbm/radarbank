/**
 * app/api/session/route.ts
 *
 * API Route para verificar sessão atual no fluxo JWT custom.
 *
 * GET /api/session
 * Response: { authenticated: boolean, user?: {...} }
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Erro na API de sessão:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
