# Mini Auction System — Starter

A compact, interview-friendly baseline for the BVCOE assignment: real-time auctions with bids via Socket.IO, Redis (Upstash), DB via Sequelize→Supabase, SendGrid emails, and a single Dockerfile deployable on Render.

## Quick Start (Local)

1. **Node 20+** and **Docker** installed.
2. Copy `.env.example` to `.env` and fill values.
3. Install backend deps:
   ```bash
   npm ci
   ```
4. Setup client:
   ```bash
   cd client
   npm ci
   npm run build
   cd ..
   ```
5. Run:
   ```bash
   npm start
   ```
   App: http://localhost:8080

## Deploy on Render
- Create a new **Web Service** from your repo.
- Use included Dockerfile (Render will detect it).
- Add env vars from `.env.example`.
- Optional: add a cron ping to `/health` using cron-job.org to avoid cold starts.

## Tech
- **Backend**: Node, Express, Socket.IO, Sequelize (Postgres)
- **DB**: Supabase
- **Realtime**: Socket.IO
- **Cache/State**: Upstash Redis
- **Email**: SendGrid
- **Frontend**: React + Vite (built and served by Express)
- **Container**: Single Dockerfile
