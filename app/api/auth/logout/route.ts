/**
 * app/api/auth/logout/route.ts
 * 
 * API Route para logout
 * 
 * POST /api/auth/logout
 * Response: { success: true }
 */

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Criar response
    const response = NextResponse.json({ success: true });

    // Remover cookie (Max-Age=0)
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na API de logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
