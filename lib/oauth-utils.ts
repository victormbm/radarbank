/**
 * lib/oauth-utils.ts
 * 
 * Utilitários para verificar se OAuth está configurado
 */

export function isGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes('seu-google')
  );
}

export function isFacebookOAuthConfigured(): boolean {
  return !!(
    process.env.FACEBOOK_CLIENT_ID && 
    process.env.FACEBOOK_CLIENT_SECRET &&
    !process.env.FACEBOOK_CLIENT_ID.includes('seu-facebook')
  );
}

export function getOAuthSetupInstructions(): string {
  const instructions = [];
  
  if (!isGoogleOAuthConfigured()) {
    instructions.push('Google OAuth não configurado. Veja docs/OAUTH_SETUP.md');
  }
  
  if (!isFacebookOAuthConfigured()) {
    instructions.push('Facebook OAuth não configurado. Veja docs/OAUTH_SETUP.md');
  }
  
  return instructions.join('\n');
}
