/**
 * app/api/auth/register/route.ts
 * 
 * API Route para registro de novos usuários
 * 
 * POST /api/auth/register
 * Body: { name, email, password }
 * Response: { success, user, error? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/auth-db';

export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json();
    const { name, email, password } = body;

    // Registrar usuário
    const result = await register({ name, email, password });

    // Se falhou, retornar erro
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Sucesso! Criar response com cookie
    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 201 }
    );

    // Set HttpOnly cookie com JWT token
    response.cookies.set('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na API de registro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar registro' },
      { status: 500 }
    );
  }
}
