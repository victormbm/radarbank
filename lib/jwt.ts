/**
 * lib/jwt.ts
 * 
 * Funções para criar e validar tokens JWT
 * 
 * Segurança:
 * - Algoritmo HS256 (HMAC SHA-256)
 * - Secret forte (32+ caracteres)
 * - Expiração de 30 dias
 * - Payload mínimo (apenas userId e email)
 */

import { SignJWT, jwtVerify } from 'jose';

/**
 * Secret para assinar/validar tokens
 * DEVE estar em variável de ambiente em produção
 */
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-only-min-32-chars'
);

/**
 * Interface do payload do token JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Cria um token JWT assinado
 * 
 * @param payload - Dados a incluir no token (userId e email)
 * @returns Token JWT assinado
 * 
 * @example
 * const token = await signJWT({
 *   userId: "clxyz123",
 *   email: "user@example.com"
 * });
 * // token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')  // 30 dias
    .sign(SECRET);
}

/**
 * Valida e decodifica um token JWT
 * 
 * @param token - Token JWT a validar
 * @returns Payload do token se válido, null se inválido/expirado
 * 
 * @example
 * const payload = await verifyJWT(token);
 * if (payload) {
 *   console.log(payload.userId); // "clxyz123"
 * } else {
 *   // Token inválido ou expirado
 * }
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    // Validar que tem os campos obrigatórios
    if (typeof payload.userId === 'string' && typeof payload.email === 'string') {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }
    
    return null;
  } catch {
    // Token inválido, expirado, ou assinatura incorreta
    return null;
  }
}
