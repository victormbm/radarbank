# ⚡ Configuração Rápida OAuth - Google e Facebook

## ✅ Problema Resolvido: MissingSecret

O erro `MissingSecret` foi corrigido! O arquivo `.env` agora está configurado com:
```env
NEXTAUTH_SECRET="Bz8TUy9ZRG4PrnilFSdqNxCW0agQMIDH"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔄 Próximos Passos

### 1. Reiniciar o Servidor (OBRIGATÓRIO)

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

As variáveis de ambiente só são carregadas quando o servidor inicia!

### 2. Configurar Google OAuth (Opcional)

Por enquanto, os botões do Google estão **desabilitados** até você configurar:

#### Passo a Passo:

1. **Acesse:** [console.cloud.google.com](https://console.cloud.google.com)
2. **Crie um projeto** ou selecione um existente
3. **Vá em:** APIs & Services > Credentials
4. **Crie:** OAuth 2.0 Client ID
5. **Configure:**
   - **Tipo:** Web application
   - **Redirect URI:** `http://localhost:3000/api/auth/callback/google`

6. **Copie as credenciais** e atualize o `.env`:

```env
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"
```

7. **Reinicie o servidor** novamente

### 3. Configurar Facebook OAuth (Opcional)

Mesma coisa para Facebook:

1. **Acesse:** [developers.facebook.com](https://developers.facebook.com)
2. **Crie um app** → Consumer
3. **Adicione:** Facebook Login
4. **Configure Redirect URI:** `http://localhost:3000/api/auth/callback/facebook`

5. **Atualize `.env`:**

```env
FACEBOOK_CLIENT_ID="123456789012345"
FACEBOOK_CLIENT_SECRET="abc123def456ghi789"
```

6. **Reinicie o servidor**

## 📝 Status Atual

- ✅ **Email/Senha:** Funcionando normalmente
- ⚠️ **Google:** Precisa configurar credenciais
- ⚠️ **Facebook:** Precisa configurar credenciais

## 🎯 Por Enquanto

**Use login com email/senha** que já funciona perfeitamente!

Os botões OAuth vão funcionar automaticamente assim que você configurar as credenciais.

## 📚 Documentação Completa

Para instruções detalhadas, veja: [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)

## 🐛 Troubleshooting

**Botão OAuth não funciona?**
- Certifique-se que as credenciais estão corretas no `.env`
- Reinicie o servidor após alterar `.env`
- Verifique se a Redirect URI está exatamente igual no console do provedor

**Erro "redirect_uri_mismatch"?**
- A URI deve ser exatamente: `http://localhost:3000/api/auth/callback/google`
- Não esqueça do `http://` e da porta `:3000`
