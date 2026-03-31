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

# NEXT_PUBLIC_* precisam ser declarados como ARG + ENV antes do build
# para que o Next.js os embuta no bundle estático
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID
ARG NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_TOP
ARG NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR
ARG NEXT_PUBLIC_ADSENSE_SLOT_FOOTER

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_TOP=$NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_TOP
ENV NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=$NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR
ENV NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=$NEXT_PUBLIC_ADSENSE_SLOT_FOOTER
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
