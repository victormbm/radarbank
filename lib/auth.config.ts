/**
 * lib/auth.config.ts
 * 
 * Configuração do NextAuth v5
 * Suporta:
 * - Login com email/senha
 * - OAuth com Google
 * - OAuth com Facebook
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import { comparePassword } from './password';

// Verificar se credenciais OAuth estão configuradas
const hasGoogleCredentials = !!(
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('seu-google')
);

const hasFacebookCredentials = !!(
  process.env.FACEBOOK_CLIENT_ID && 
  process.env.FACEBOOK_CLIENT_SECRET &&
  !process.env.FACEBOOK_CLIENT_ID.includes('seu-facebook')
);

// Construir lista de providers
const providers = [];

// Adicionar Google se configurado
if (hasGoogleCredentials) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

// Adicionar Facebook se configurado
if (hasFacebookCredentials) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  );
}

// Sempre adicionar email/password
providers.push(
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email e senha são obrigatórios');
      }

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isValid = await comparePassword(password, user.password);
      
      if (!isValid) {
        throw new Error('Credenciais inválidas');
      }

      // Retornar usuário (sem senha)
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar,
      };
    }
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Usuário fazendo login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      // OAuth provider info
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      
      return session;
    },

    async signIn({ user, account }) {
      // Permitir login com email/password
      if (account?.provider === 'credentials') {
        return true;
      }

      // OAuth - verificar se email existe
      if (!user.email) {
        return false;
      }

      // Por enquanto, permitir login OAuth
      // A vinculação de contas será feita automaticamente pelo adapter
      return true;
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  debug: process.env.NODE_ENV === 'development',
});
