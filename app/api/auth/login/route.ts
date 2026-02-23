/**
 * app/api/auth/login/route.ts
 * 
 * API Route para login de usuários
 * 
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { success, user, error? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth-db';

export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json();
    const { email, password } = body;

    // Fazer login
    const result = await login(email, password);

    // Se falhou, retornar erro
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Sucesso! Criar response com cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set HttpOnly cookie com JWT token
    response.cookies.set('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na API de login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
