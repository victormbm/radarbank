# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --prefer-offline --legacy-peer-deps
# Gera o Prisma Client para o target linux/alpine (necessário no Cloud Run)
RUN npx prisma generate


# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Não precisa do .env real; as variáveis são injetadas em runtime pelo Cloud Run
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cloud Run injeta a porta via $PORT (padrão 8080)
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Usuário não-root por segurança (princípio de menor privilégio)
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia apenas o que o standalone precisa
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
