# Deploy GCP Passo a Passo (Cloud Run + Cloud Build)

Este guia coloca a aplicacao em producao hoje com:
- dados oficiais do BCB
- atualizacao automatica
- protecao de endpoints administrativos
- base para monetizacao (ads + afiliacao)

## 1. Pre requisitos

No Windows:
1. Instale Google Cloud SDK (gcloud)
2. Rode `gcloud auth login`
3. Rode `gcloud auth application-default login`
4. Tenha um projeto GCP criado
5. Tenha um Postgres de producao e `DATABASE_URL`

## 2. Defina variaveis no PowerShell

```powershell
$env:PROJECT_ID = "seu-projeto-gcp"
$env:APP_URL = "https://bancosegurobr.com.br"

$env:DATABASE_URL = "postgresql://..."
$env:JWT_SECRET = "<segredo-forte>"
$env:ADMIN_API_KEY = "<segredo-admin-forte>"
$env:CRON_SECRET = "<segredo-cron-forte>"
$env:UPSTASH_REDIS_REST_URL = "https://...upstash.io"
$env:UPSTASH_REDIS_REST_TOKEN = "..."
```

Gerar segredos fortes:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## 3. Execute deploy automatizado

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-gcp.ps1 `
  -ProjectId $env:PROJECT_ID `
  -AppUrl "https://bancosegurobr.com.br"
```

O script faz:
1. ativa APIs necessarias
2. cria Artifact Registry
3. cria/atualiza secrets
4. executa Cloud Build + deploy Cloud Run
5. cria/atualiza Cloud Scheduler (6h)

## 4. Migracao do banco (obrigatorio)

Antes de liberar para usuarios, aplique schema no banco de producao:

```powershell
$env:DATABASE_URL = "postgresql://...producao..."
npx prisma db push
```

Se voce preferir controle por migration versionada:

```powershell
npx prisma migrate deploy
```

## 5. Ingestao real e recompute manual inicial

Depois do deploy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-prod.ps1 `
  -BaseUrl "https://SEU_CLOUD_RUN_URL" `
  -AdminApiKey $env:ADMIN_API_KEY
```

Isso valida:
1. endpoint publico de bancos
2. ingestao BCB protegida por chave admin
3. recompute protegido por chave admin
4. bloqueio 401 sem chave admin

## 6. Hardening minimo para trafego aberto

1. Cloud Armor no Load Balancer
2. Rate limit app + Redis (ja preparado)
3. Login/register com captcha
4. Alertas no Cloud Logging para 401/429/5xx
5. Rotacao periodica de secrets

Nota: risco zero nao existe. O objetivo e reduzir risco com defesa em camadas.

## 7. Monetizacao apos deploy

## 7.1 Anuncios
1. Conectar Google AdSense
2. Inserir em paginas de conteudo e comparativos
3. Evitar excesso no dashboard logado

## 7.2 Abertura de conta e afiliacao
1. Criar pagina de comparacao por banco
2. Adicionar links de afiliado com UTM
3. Medir funil: clique -> lead -> abertura -> comissao

## 8. Comandos de operacao diaria

Ver logs Cloud Run:

```powershell
gcloud run services logs read radar-bank --region southamerica-east1 --project $env:PROJECT_ID --limit=200
```

Forcar ingestao manual:

```powershell
curl -H "Authorization: Bearer $env:ADMIN_API_KEY" "https://SEU_CLOUD_RUN_URL/api/ingest/bcb"
```

Verificar status ingestao:

```powershell
curl "https://SEU_CLOUD_RUN_URL/api/ingest/status"
```

## 9. Checklist go-live

- [ ] Cloud Run online
- [ ] Prisma aplicado em producao
- [ ] Ingestao BCB executada sem erro
- [ ] Recompute executado sem erro
- [ ] Scheduler ativo a cada 6h
- [ ] Endpoint admin bloqueado sem chave
- [ ] Dominio e HTTPS configurados
- [ ] Ads e tracking ativos
- [ ] Pagina de afiliacao publicada
