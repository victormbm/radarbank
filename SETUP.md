# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure database:**
   
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bank_health_monitor?schema=public"
   ```
   
   Replace `user`, `password`, `localhost`, and `5432` with your PostgreSQL credentials.

3. **Setup database:**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to http://localhost:3000

## Post-Setup

After seeding, the dashboard will display 6 banks with computed health scores. You can:

- View all banks on the dashboard at `/dashboard`
- Click any bank to see detailed metrics at `/banks/:id`
- Seed additional data via `POST /api/ingest/seed`
- Recompute all scores via `POST /api/score/recompute`

## Scoring Logic

The health score is computed from:
- **Capital (35%)**: Basel capital ratio (normalized from 8-20%)
- **Liquidity (25%)**: Quick liquidity ratio (normalized from 80-200%)
- **Profitability (15%)**: Return on Equity (normalized from 0-30%)
- **Credit (0%)**: Reserved for future NPL ratio implementation

Status indicators:
- **Green (Healthy)**: Score >= 70
- **Yellow (Warning)**: Score >= 50 and < 70
- **Red (Critical)**: Score < 50
