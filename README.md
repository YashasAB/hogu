# Hogu Starter (Replit-ready)

Monorepo with:
- **apps/web**: React + Vite + Tailwind (TypeScript)
- **apps/api**: Express + Prisma (SQLite dev)

## Quickstart (Replit)
1) Create a new **Node.js** Replit and upload/extract the ZIP of this project.
2) In the Replit shell, run:
   ```bash
   npm i -g pnpm
   pnpm install
   pnpm -C apps/api prisma:migrate
   pnpm dev
   ```
3) Open the web preview URL shown by Vite (usually port 5173). The API runs on port 8080.

> For production, switch Prisma to Postgres and move secrets into `.env`.

## What’s included
- Minimal schema (`users`, `restaurants`, `inventory_slots`, `reservations`) and seed.
- Auth (email + password) endpoints (simple, replace with OTP/OAuth later).
- Availability search + hold/confirm skeletons.
- React app with pages + router + Tailwind tokens (Resy-inspired vibe).

See the full technical spec you created earlier for the complete roadmap.
