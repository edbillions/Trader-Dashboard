# Trader Hub — Personal ICT Trading Dashboard

A personal, local-only trading journal and dashboard built around ICT (Inner Circle Trader)
concepts and the Unicorn Model. Replaces generic tools like Tradervue/TradeZella with one that
speaks your own trading vocabulary — your confluence checklist, your sessions, your prop firm
accounts.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via Prisma ORM (local file database, no external services)
- Anthropic Claude API for AI features (your own API key)

## Getting started

```bash
npm install
npx prisma migrate dev   # creates/updates the local SQLite database
npx prisma db seed       # seeds ICT taxonomy lookups, starter rules, instrument tick values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to enable AI features (auto-summarize,
rule-violation flagging, pattern insights, and the floating Q&A chat). Everything else works
without it.

## Project structure

- `src/app` — routes: dashboard, calendar, trades, journal, coach, analytics, prop-firms,
  settings
- `src/lib` — Prisma client, domain logic (P&L calc, streaks, discipline score, tilt detection)
- `src/components` — shared UI
- `prisma/schema.prisma` — data model
- `prisma/seed.ts` — seeds the editable ICT tag lists, starter rule-violation checklist, and
  instrument tick values
