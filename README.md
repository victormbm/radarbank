# Bank Health Monitor

A SaaS dashboard for monitoring bank health scores computed from financial metrics.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL
- TailwindCSS + shadcn/ui
- Zod for validation
- Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env` file based on `.env.example`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bank_health_monitor?schema=public"
```

3. Run Prisma migrations:

```bash
npm run prisma:migrate
```

4. Seed the database:

```bash
npm run prisma:seed
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### API Endpoints

- `GET /api/banks` - List all banks with scores
- `GET /api/banks/:id` - Get bank details with metrics
- `POST /api/ingest/seed` - Seed additional sample data
- `POST /api/score/recompute` - Recompute scores for all banks

### Project Structure

```
/app                  - Next.js App Router pages and API routes
/components           - React components (UI and app-specific)
/lib                  - Utilities (db, scoring, validation)
/server               - Server-side services (ingestion, scoring)
/prisma               - Database schema and seed
```

## Features

- Dashboard with banks table showing health scores and status
- Individual bank detail pages with score breakdown
- Metrics visualization with historical data
- Scoring algorithm based on:
  - Capital adequacy (35%): Basel ratio
  - Liquidity (25%): Quick liquidity ratio
  - Profitability (15%): ROE
  - Credit quality (0% - future implementation)
- RESTful API for data access
- Data ingestion pipeline skeleton

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database
