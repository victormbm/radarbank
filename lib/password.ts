/**
 * lib/password.ts
 * 
 * Funções para hash e comparação de senhas usando bcrypt
 * 
 * Segurança:
 * - bcrypt com 10 rounds (~100ms por hash)
 * - Salt automático (único para cada senha)
 * - Impossível reverter hash para senha original
 */

import bcrypt from 'bcryptjs';

/**
 * Cria hash bcrypt de uma senha
 * 
 * @param password - Senha em texto puro
 * @returns Hash bcrypt da senha
 * 
 * @example
 * const hash = await hashPassword("senha123");
 * // hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G"
 */
export async function hashPassword(password: string): Promise<string> {
  // 10 rounds = 2^10 = 1024 iterações
  // Tempo: ~100ms (bom balanço segurança vs performance)
  return bcrypt.hash(password, 10);
}

/**
 * Compara senha em texto puro com hash bcrypt
 * 
 * @param plainPassword - Senha em texto puro (input do usuário)
 * @param hashedPassword - Hash bcrypt armazenado no banco
 * @returns true se a senha bate com o hash, false caso contrário
 * 
 * @example
 * const isValid = await comparePassword("senha123", user.password);
 * if (isValid) {
 *   // Login bem-sucedido
 * }
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
