/**
 * lib/auth-db.ts
 * 
 * Sistema de autenticação baseado em banco de dados
 * 
 * Features:
 * - Registro de usuários com hash bcrypt
 * - Login com validação de senha
 * - Verificação de sessão via JWT
 * - Proteção contra ataques comuns (SQL injection, timing attacks, etc.)
 */

import { cookies } from 'next/headers';
import { prisma } from './db';
import { hashPassword, comparePassword } from './password';
import { signJWT, verifyJWT } from './jwt';

/**
 * Interface do usuário (sem senha)
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
}

/**
 * Interface de dados para registro
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Interface de resultado de operações
 */
export interface AuthResult {
  success: boolean;
  user?: SafeUser;
  token?: string;
  error?: string;
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Registra um novo usuário
 * 
 * @param data - Dados do usuário (name, email, password)
 * @returns Objeto com sucesso, usuário e token
 * 
 * @example
 * const result = await register({
 *   name: "João Silva",
 *   email: "joao@exemplo.com",
 *   password: "senha123"
 * });
 * if (result.success) {
 *   // Usuário criado, token gerado
 * }
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  try {
    // Validações
    if (!data.name || !data.email || !data.password) {
      return { success: false, error: 'Preencha todos os campos' };
    }

    // Normalizar email
    const normalizedEmail = data.email.trim().toLowerCase();

    // Validar formato de email
    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Email inválido' };
    }

    // Validar senha (mínimo 6 caracteres)
    if (data.password.length < 6) {
      return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
    }

    // Verificar se email já está cadastrado
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: 'Este email já está cadastrado' };
    }

    // Hash da senha
    const hashedPassword = await hashPassword(data.password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Gerar JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
    });

    return {
      success: true,
      user,
      token,
    };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return { success: false, error: 'Erro ao criar conta' };
  }
}

/**
 * Faz login de um usuário existente
 * 
 * @param email - Email do usuário
 * @param password - Senha em texto puro
 * @returns Objeto com sucesso, usuário e token
 * 
 * @example
 * const result = await login("joao@exemplo.com", "senha123");
 * if (result.success) {
 *   // Login bem-sucedido
 * }
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validações básicas
    if (!email || !password) {
      return { success: false, error: 'Preencha todos os campos' };
    }

    // Normalizar email
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Se não encontrar, retornar erro genérico (não revelar se email existe)
    if (!user) {
      return { success: false, error: 'Email ou senha inválidos' };
    }

    // Comparar senha com hash
    const isValidPassword = await comparePassword(password, user.password);

    // Se senha inválida, retornar erro genérico
    if (!isValidPassword) {
      return { success: false, error: 'Email ou senha inválidos' };
    }

    // Gerar JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
    });

    // Retornar usuário (sem senha)
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return {
      success: true,
      user: safeUser,
      token,
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
}

/**
 * Retorna o usuário atualmente autenticado (via cookie)
 * 
 * @returns Usuário autenticado ou null
 * 
 * @example
 * // Em Server Component ou API Route
 * const user = await getCurrentUser();
 * if (!user) {
 *   redirect('/login');
 * }
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    // Ler cookie
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    // Validar JWT
    const payload = await verifyJWT(token);

    if (!payload) {
      return null;
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

/**
 * Verifica se há usuário autenticado
 * 
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
