# Kin — Progress Log

## 2026-03-23 — Session 1: Product pivot + full web MVP

### Accomplished
- Brainstormed product concept: personal friend CRM → social address exchange (CEO review + research)
- Deep research: Postable, Nikita Bier viral loops, Partiful, Giftster wishlist mechanics
- Pivoted product from private CRM to viral social address exchange
- Built Vite prototype with warm analog design (Grand Hotel, Caveat, Quicksand fonts)
- Scaffolded Next.js 15 project, ported design system
- Set up Neon Postgres (kin-db) via Vercel, Drizzle ORM schema (v2: social model)
- Set up Clerk auth with Google OAuth (keys configured, middleware working)
- Created GitHub repo + Vercel project (auto-deploy)
- Built complete web MVP (63 source files):
  - Auth (Clerk middleware, sign-in/up pages)
  - Dashboard with timeline sidebar + friend roster grid
  - Person CRUD with zod validation + chrono-node date parsing
  - Add/Edit person drawer with tier selector
  - Friend detail page with freshness indicators
  - Address request flow (create → beautiful public form → complete → notify)
  - "You've been added" curiosity notification page
  - Notification bell with unread count
  - Wishlists with stealth purchase tracking (Giftster pattern)
  - Settings page (profile, notifications, privacy)
  - 4-step onboarding flow
  - Mobile bottom nav bar
  - PWA manifest + icons
  - OG meta tags for link previews
  - Birthday reminder cron job
- Two design specs: v1 (private CRM, superseded), v2 (social address exchange, active)
- Deployed to https://kin-steel.vercel.app

### Files Modified
| Area | Count | Key Files |
|------|-------|-----------|
| Schema | 1 | `src/lib/db/schema.ts` (12 tables, 6 enums) |
| Actions | 5 | persons, address-requests, notifications, wishlists, settings |
| Queries | 3 | persons, events, wishlists |
| Pages | 11 | dashboard, friends/[id], a/[token], added/[token], wishlist, settings, onboarding, sign-in, sign-up |
| Components | 10 | top-nav, timeline, friend-card, tag, person-drawer, address-request-button, notification-bell, nav-bar, dashboard-client |
| Specs | 2 | v1 CRM spec (superseded), v2 social address exchange spec |

### Next Steps
- [ ] Configure Clerk dashboard: rename app to "Kin", enable Google OAuth, set up webhook
- [ ] Twilio SMS integration for address requests + "you've been added"
- [ ] iOS app with iMessage extension (Swift)
- [ ] Custom domain (kin.app or similar)
- [ ] End-to-end testing with real users
- [ ] Phase 2: Google Calendar sync, Gmail parsing, Calendar Library
