# Kin — Social Address Exchange

## Overview
Social address exchange app with viral mechanics. Address requests as the viral trigger, tiered privacy groups, wishlists with stealth purchase tracking.

## Tech Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **Auth:** Clerk (@clerk/nextjs) with Google OAuth
- **Database:** Neon Postgres via Vercel integration
- **ORM:** Drizzle (drizzle-orm + drizzle-kit)
- **Styling:** CSS Modules + custom design tokens (warm analog aesthetic)
- **Validation:** Zod
- **Date parsing:** chrono-node
- **Deployment:** Vercel (auto-deploy from GitHub)

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npx drizzle-kit push # Push schema changes to Neon
npx drizzle-kit generate # Generate migration snapshot
```

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Dashboard (home)
│   ├── layout.tsx                  # Root layout with ClerkProvider
│   ├── globals.css                 # Design tokens + base styles
│   ├── a/[token]/                  # Public address request form
│   ├── added/[token]/              # "You've been added" public page
│   ├── friends/[id]/               # Friend detail + wishlist
│   ├── wishlist/                   # My wishlist
│   ├── settings/                   # Settings
│   ├── onboarding/                 # First-time setup
│   ├── sign-in/                    # Clerk sign-in
│   ├── sign-up/                    # Clerk sign-up
│   └── api/
│       ├── webhooks/clerk/         # User sync webhook
│       └── cron/birthday-reminders/ # Daily cron
├── components/                     # Shared UI components
├── lib/
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema (12 tables)
│   │   └── index.ts               # DB connection
│   ├── actions/                    # Server actions
│   ├── queries/                    # Read-only query helpers
│   └── validators/                 # Zod schemas
├── middleware.ts                   # Clerk auth middleware
docs/superpowers/
├── specs/                          # Design specs
└── plans/                          # Implementation plans
```

## Design System
Warm analog aesthetic — feels like a handwritten letter. Fonts: Grand Hotel (brand), Caveat (accents), Quicksand (UI). Colors: cream/brown palette with baked orange accent. Paper texture noise overlay.

CSS variables defined in `globals.css`: `--bg-base`, `--bg-card`, `--bg-input`, `--text-main`, `--text-muted`, `--accent-cream`, `--accent-baked`.

## Key Patterns
- **Tiered privacy:** Everyone → Friends → Inner Circle (per-person)
- **Address requests:** One-time token, 7-day expiry, beautiful public form
- **Sentinel year 1904** for birthdays when year is unknown
- **Server actions** for all mutations (src/lib/actions/)
- **Server components** by default, `'use client'` only where needed

## Environment Variables
```
DATABASE_URL          # Neon Postgres connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET  # Not yet configured
CRON_SECRET           # For Vercel cron authentication
```

## Deployment
- **GitHub:** https://github.com/bobbyteenager89/kin
- **Vercel:** https://kin-steel.vercel.app
- **Database:** Neon (kin-db), Washington D.C. region, Free tier
