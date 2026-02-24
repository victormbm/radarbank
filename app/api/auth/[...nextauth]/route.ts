/**
 * app/api/auth/[...nextauth]/route.ts
 * 
 * Route handler do NextAuth para OAuth
 */

import { handlers } from '@/lib/auth.config';

export const { GET, POST } = handlers;
