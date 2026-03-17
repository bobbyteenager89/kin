# Kin — Personal CRM Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Overview

Kin is a personal CRM for real life — a warm, analog-feeling web app that helps you remember the people you care about. Birthdays, anniversaries, kids' names, addresses, and life events — all in one place, synced to your calendar, and enriched by automatic email parsing.

Beyond friends, Kin is also a **life calendar hub** with a curated library of subscribable public calendars (sports, awards shows, cultural events) and an AI-powered custom calendar builder.

## Target User

Public product — anyone who wants to stay connected with friends and never miss an important date. Free forever, no monetization.

## Design Direction

Warm and analog. Feels like a handwritten letter or a well-loved address book — soft textures, rounded type, tactile warmth. Inspired by Apple Contacts' clean minimalism but with more personality and soul. Paper texture overlay, cream/brown palette, cursive accent fonts.

**Anti-references:** Not a sales CRM, not social media, not enterprise.

**Design tokens and visual reference:** Implemented in `/src/index.css` and component CSS modules. Fonts: Grand Hotel (brand), Caveat (accents), Quicksand (UI).

## Data Model

### Person

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| ownerUserId | uuid | FK to users — who added this person |
| claimedByUserId | uuid? | FK to users — if friend claims their profile (v2) |
| name | text | Required |
| nickname | text? | |
| avatarUrl | text? | |
| relation | text? | "College Roommate", "Neighbor", etc. |
| birthday | date? | Month + day, year optional |
| partnerName | text? | |
| weddingAnniversary | date? | |
| address | jsonb? | { street, city, state, zip } |
| phone | text? | |
| email | text? | |
| tags | text[] | Freeform: "Vegan", "Dog: Buster" |
| notes | text? | |
| lastCaughtUp | timestamp? | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Child (belongs to Person)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| personId | uuid | FK |
| name | text | |
| birthday | date? | |

### Event

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK to users |
| personId | uuid? | FK — null for public calendar events |
| type | enum | birthday, anniversary, kids_birthday, address_change, custom |
| title | text | |
| date | date | |
| recurring | boolean | Annual recurrence |
| description | text? | |
| source | enum | manual, gmail_import, calendar_sync, public_calendar, ai_generated |
| googleCalendarEventId | text? | For sync |
| createdAt | timestamp | |

### ImportSuggestion

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK |
| source | text | "zola", "partiful", "paperless_post" |
| emailSubject | text | |
| extractedData | jsonb | AI-parsed: host, event name, date, location |
| status | enum | pending, approved, dismissed |
| createdAt | timestamp | |

### PublicCalendar

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | text | "NFL — Green Bay Packers" |
| category | text | sports, awards, cultural, holidays, conferences |
| description | text? | |
| iconUrl | text? | |
| eventCount | int | |
| isAiGenerated | boolean | Promoted from AI builder |
| createdByUserId | uuid? | Null for curated |
| createdAt | timestamp | |

### CalendarSubscription

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | uuid | FK |
| calendarId | uuid | FK to PublicCalendar |
| googleCalendarId | text? | Synced calendar ID |
| subscribedAt | timestamp | |

### User

Managed by Clerk. Extended with:

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Clerk user ID |
| gmailAccessToken | text? | Encrypted |
| gmailRefreshToken | text? | Encrypted |
| googleCalendarToken | text? | Encrypted |
| notificationPrefs | jsonb | { birthdayDaysBefore: 1, anniversaryDaysBefore: 7, ... } |

## Architecture

### Frontend

- Next.js 15, App Router, server components by default
- CSS Modules with design tokens from the Variant HTML reference
- Responsive: 2-column desktop (timeline + roster) → stacked mobile
- PWA manifest + service worker for iOS home screen

### Auth

- Clerk with Google OAuth as primary provider
- On sign-up, prompt to connect Gmail + Google Calendar (additional OAuth scopes)

### Google Calendar Sync

- Kin creates named calendars: "Kin — Birthdays", "Kin — Anniversaries", per-subscription calendars for public calendars
- Events pushed on person create/edit
- Background sync via Vercel Cron every 6 hours
- Two-way: changes in Google Calendar reflected back

### Gmail Email Parsing

- Gmail API with read-only scope
- Gmail push notifications (pub/sub webhook) trigger parsing, polling fallback
- Scans for emails from: Zola (`@zola.com`), Partiful (`@partiful.com`), Paperless Post (`@paperlesspost.com`)
- Claude API extracts: event name, date, host name, location
- Results stored as ImportSuggestions — user confirms before adding

### Calendar Library

- Curated public calendars stored in Neon, browsable by category
- Categories: Pro Sports, Awards Shows, Cultural Events, Holidays, Conferences
- Subscribe button syncs events to user's Google Calendar
- AI Custom Calendar Builder: user prompts Claude API, generates event list, user reviews and subscribes
- Popular AI calendars promoted to curated library

### Notifications

- Web Push API via PWA service worker
- Configurable per event type: days before, enabled/disabled
- Calendar handles its own reminders for synced events

### Database

- Neon Postgres via Vercel integration
- Drizzle ORM for type-safe queries + migrations
- Env var: `DATABASE_URL` (not `STORAGE_URL`)

### Deployment

- Vercel (auto-deploy from GitHub)
- Vercel Cron for background jobs (calendar sync, gmail polling)

## Screens

### 1. Dashboard (Home)

- Timeline sidebar (left): upcoming events chronologically, event cards with type badge, date, description, action link
- Friend roster grid (right): featured card for next-event friend, standard cards for rest
- Search pill: real-time filter on roster
- "+ Add Person" button in top nav
- Brand mark "kin" in cursive, top-left

### 2. Friend Profile (Detail)

- Expanded view on card click (page or slide-out)
- All fields: dates, address, children, tags, notes
- "Last Caught Up" with "Mark as caught up" button
- Event history for this person
- Gift ideas notepad (v2: deferred but structurally planned)

### 3. Add/Edit Person

- Slide-out drawer or modal
- All person fields + dynamic children list (add/remove)
- Smart date input (understands "March 15" without year)

### 4. Import Suggestions

- Cards for each email-parsed suggestion
- Source badge (Zola/Partiful/Paperless Post)
- Extracted details preview
- Approve (creates person + event) or dismiss
- Batch approve option

### 5. Calendar Library

- Grid of calendar cards: icon, name, event count, next event preview
- Category filter tabs + search
- "Build Custom" CTA with AI prompt input
- Subscribe toggle per calendar
- Preview expansion showing upcoming events

### 6. Settings

- Connected accounts (Gmail, Google Calendar) with connect/disconnect
- Notification preferences per event type
- Profile management (v2: what you share to contacts)

### First-Time Setup Flow

1. Sign up with Google (Clerk)
2. "Connect Gmail to auto-import events?" → OAuth
3. "Connect Google Calendar to sync birthdays?" → OAuth
4. Empty dashboard with "Add your first friend" CTA + "Browse Calendars" secondary CTA
5. Import suggestions appear as Gmail is scanned

## MVP Scope (v1)

1. Auth + onboarding (Clerk, Google OAuth, Gmail/Calendar connect)
2. Dashboard — timeline + friend roster
3. Add/edit/delete friends with all fields
4. Friend profile detail view
5. Google Calendar sync (push birthdays/anniversaries)
6. Gmail email parsing (Zola, Partiful, Paperless Post) with approval flow
7. Calendar Library — curated public calendars + AI custom builder
8. Push notifications for upcoming events
9. PWA manifest for iOS home screen

## Deferred (v2+)

- Friend profile claiming (invite link social model)
- Tiered visibility permissions (birthday public, address request-only)
- Message frequency analysis for auto-granting access
- Gift ideas notepad
- "Haven't caught up in a while" nudges
- Native iOS app via Capacitor
- Shared family profiles
- Photo memories integration

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Auth | Clerk (Google OAuth) |
| Database | Neon Postgres (Vercel integration) |
| ORM | Drizzle |
| Styling | CSS Modules + design tokens |
| AI | Claude API (email parsing, calendar builder) |
| APIs | Gmail API, Google Calendar API |
| Notifications | Web Push API (PWA) |
| Deployment | Vercel |
| iOS path | PWA → Capacitor (later) |
