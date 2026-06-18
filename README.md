# 💙 Dexcom G7 Glucose Tracker

A full-stack glucose monitoring dashboard for your daughter's Dexcom G7. Automatically polls the Dexcom API every 5 minutes, stores all readings, generates visual charts, fires alerts, and uses Claude AI to analyze patterns and surface suggestions for your care team.

## Features

- **Live Dashboard** — Current glucose reading with trend arrow, color-coded status, and staleness detection
- **Historical Charts** — View 3h, 6h, 12h, 24h, or 48h of readings with in-range/low/high zone shading
- **Time-in-Range Stats** — Real-time % in range, below, above, average, min/max
- **Smart Alerts** — Visual alerts for highs, lows, rapid rises, and rapid falls (30-min cooldown)
- **AI Analysis** — Claude-powered daily and weekly analysis with pattern insights and care team suggestions
- **Persistent Storage** — All readings stored in PostgreSQL; nothing lost on redeploy
- **Auto Token Refresh** — Dexcom OAuth tokens refresh automatically

--- 

## Architecture

```
GitHub (monorepo)
├── frontend/       React app → GitHub Pages (free)
└── backend/        Node.js/Express → Render.com (free)
                    └── PostgreSQL → Supabase (free)
```

---

## Setup Guide

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/dexcom-tracker.git
cd dexcom-tracker
```

### 2. Set up Supabase (database)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once created, go to **Settings → Database → Connection String (URI)**
3. Copy the connection string — you'll use it as `DATABASE_URL`

### 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — your Supabase connection string
- `DEXCOM_CLIENT_ID` — from your Dexcom Developer account
- `DEXCOM_CLIENT_SECRET` — from your Dexcom Developer account
- `DEXCOM_REDIRECT_URI` — set to `https://your-backend.onrender.com/auth/callback`
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `FRONTEND_URL` — your GitHub Pages URL (e.g. `https://yourusername.github.io/dexcom-tracker`)

Run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

### 4. Deploy backend to Render

1. Go to [render.com](https://render.com) and create a free account
2. New → **Web Service** → connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy`
5. **Start command**: `npm start`
6. Add all your environment variables from `.env` under the **Environment** tab
7. Deploy — note your Render URL (e.g. `https://dexcom-tracker-backend.onrender.com`)

### 5. Update your Dexcom app's redirect URI

In your Dexcom Developer account, add your Render callback URL:
```
https://your-backend.onrender.com/auth/callback
```

### 6. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

Test locally:
```bash
npm start
```

### 7. Deploy frontend to GitHub Pages

1. In your GitHub repo → **Settings → Pages → Source: GitHub Actions**
2. Add a secret: **Settings → Secrets → Actions → New secret**
   - Name: `REACT_APP_API_URL`
   - Value: your Render backend URL
3. Push to `main` — GitHub Actions will automatically build and deploy

---

## Local Development

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm start
```

---

## Glucose Thresholds

Configurable via backend `.env`:

| Variable | Default | Description |
|---|---|---|
| `ALERT_HIGH_THRESHOLD` | 180 | High alert (mg/dL) |
| `ALERT_LOW_THRESHOLD` | 70 | Low alert (mg/dL) |
| `ALERT_RAPID_RISE_RATE` | 2.0 | Rapid rise (mg/dL/min) |
| `ALERT_RAPID_FALL_RATE` | -2.0 | Rapid fall (mg/dL/min) |

---

## AI Analysis

The app uses Claude (`claude-sonnet-4-6`) to analyze glucose patterns. Run an analysis from the dashboard to get:

- **Summary** — Plain-language interpretation of the period's data
- **Suggestions** — Specific, time-aware recommendations to discuss with your endocrinologist

> ⚠️ AI insights are informational only. Always consult your diabetes care team before making treatment changes.

---

## Database Schema

- **GlucoseReading** — every 5-minute reading from Dexcom
- **Alert** — high/low/rapid-rise/fall events
- **AnalysisReport** — stored AI analysis reports with statistics
- **User** — Dexcom OAuth tokens

Use Prisma Studio to browse data locally:
```bash
cd backend && npm run db:studio
```

---

## License

MIT
