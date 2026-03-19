# Kin — Social Address Exchange — Design Spec v2

**Date:** 2026-03-19
**Status:** Approved
**Supersedes:** `2026-03-17-kin-personal-crm-design.md`

## Overview

Kin is a **social address exchange** — the app that makes sure you never have to awkwardly text "what's your address?" again. Built around a viral address request loop: you send a beautiful iMessage to a friend asking for their address, they tap to share it, and they discover Kin in the process.

Beyond addresses, Kin is where you keep track of the people you care about — birthdays, anniversaries, kids' names, wishlists — organized into tiered privacy groups so you share the right info with the right people.

## Product Vision

**The pain:** Every adult texts "what's your address?" 5-20 times a year. Before weddings, holidays, birthdays, moves. It's awkward, repetitive, and the info gets lost in a text thread.

**The solution:** A single place where your friends keep their info up-to-date, you get reminders before important dates, and address requests are beautiful, branded artifacts that feel like receiving a letter — not a form link.

**The viral loop:** Every address request is an acquisition event. Every "you've been added" notification creates curiosity. Every birthday reminder drives engagement. Every wishlist prevents awkward "what do you want?" conversations.

## Design Direction

Warm and analog. Feels like a handwritten letter or a well-loved address book — soft textures, rounded type, tactile warmth. Inspired by Apple Contacts' clean minimalism but with more personality and soul. Paper texture overlay, cream/brown palette, cursive accent fonts.

**Fonts:** Grand Hotel (brand), Caveat (accents), Quicksand (UI)
**Anti-references:** Not a sales CRM, not social media, not enterprise.

## Core Viral Loop

```
User A adds friend ──▶ "You've been added" SMS/notification
       │                         │
       ▼                         ▼
User A requests address ──▶ Beautiful iMessage to friend
       │                         │
       ▼                         ▼
Address received            Friend creates Kin account
       │                         │
       ▼                         ▼
Birthday reminder           Friend adds THEIR friends
       │                         │
       ▼                         ▼
Check wishlist              Cycle repeats (K > 1)
```

## Tiered Privacy Model

```
┌─────────────────────────────────────────────────────┐
│  TIER 1: EVERYONE (any Kin contact sees this)       │
│  Name, birthday (month/day), city                    │
├─────────────────────────────────────────────────────┤
│  TIER 2: FRIENDS (mutual connection)                 │
│  + Full birthday with year, partner name, kids,      │
│    social handles                                    │
├─────────────────────────────────────────────────────┤
│  TIER 3: INNER CIRCLE (explicit grant)               │
│  + Home address, phone, gift wishlist access          │
└─────────────────────────────────────────────────────┘
```

- Tier assignment is per-relationship, not global
- "Inner Circle" requires explicit opt-in from both sides
- Address sharing via address request is always explicit (one-time token)
- Smart suggestion: if someone texts you frequently, suggest upgrading them

## Data Model

### User

Managed by Clerk (Google OAuth). Extended with:

| Field | Type | Notes |
|-------|------|-------|
| id | text | Clerk user ID (PK) |
| phone | text? | For SMS notifications |
| city | text? | Public-tier info |
| bio | text? | Short personal note |
| notificationPrefs | jsonb | { birthdayDaysBefore, enabled } |
| createdAt | timestamp | |

### Person (Contact)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| ownerUserId | text | FK — who added this person |
| claimedByUserId | text? | FK — if this person has a Kin account |
| name | text | Required |
| nickname | text? | |
| avatarUrl | text? | |
| relation | text? | "College Roommate", "Neighbor" |
| birthday | date? | Sentinel year 1904 if year unknown |
| partnerName | text? | |
| weddingAnniversary | date? | |
| address | jsonb? | { street, city, state, zip } |
| addressVerifiedAt | timestamp? | When they last confirmed |
| phone | text? | |
| email | text? | |
| tags | text[] | Freeform |
| notes | text? | |
| lastCaughtUp | timestamp? | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Child

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| personId | uuid | FK → persons |
| name | text | |
| birthday | date? | |

### Friendship

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | text | FK → users |
| friendUserId | text | FK → users |
| tier | text | 'everyone' / 'friends' / 'inner_circle' |
| status | text | 'pending' / 'active' |
| createdAt | timestamp | |

### AddressRequest

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| senderId | text | FK → users |
| recipientPersonId | uuid | FK → persons |
| token | text | Unique, URL-safe random string |
| recipientPhone | text? | Where to send the request |
| recipientEmail | text? | Alternative delivery |
| message | text? | Personal note from sender |
| status | text | 'pending' / 'completed' / 'expired' |
| expiresAt | timestamp | 7 days from creation |
| respondedAt | timestamp? | |
| createdAt | timestamp | |

### Wishlist

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | text | FK → users (owner) |
| createdAt | timestamp | |

### WishlistItem

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| wishlistId | uuid | FK → wishlists |
| title | text | "AirPods Max" |
| url | text? | Product link |
| notes | text? | Size, color, etc. |
| priority | int | 1=high, 3=low |
| createdAt | timestamp | |

### WishlistPurchase

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| wishlistItemId | uuid | FK → wishlist_items |
| purchasedByUserId | text | FK → users |
| hiddenFromUserId | text | FK → users (the wishlist owner — they can't see this) |
| createdAt | timestamp | |

### Notification

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | text | FK → users (recipient) |
| type | text | 'added_to_circle', 'address_request', 'birthday_reminder', 'verify_address', 'wishlist_purchased' |
| data | jsonb | Context-specific payload |
| read | boolean | Default false |
| createdAt | timestamp | |

### Event (simplified from v1)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| userId | text | FK → users |
| personId | uuid? | FK → persons |
| type | text | 'birthday', 'anniversary', 'kids_birthday', 'custom' |
| title | text | |
| date | date | |
| recurring | boolean | |
| source | text | 'manual', 'address_request' |
| createdAt | timestamp | |

## Architecture

### Platform

- **Web app:** Next.js 15 (App Router) — dashboard, account management, address forms, wishlists
- **iOS app:** Thin Swift app — iMessage extension for sending address requests, deep links to web
- **Shared backend:** Next.js API routes serve both web and iOS

### Auth

- Clerk with Google OAuth
- Phone number collection during onboarding (for SMS features)

### Address Request Flow

1. User taps "Request Address" on a contact (web) or via iMessage extension (iOS)
2. System generates a unique token, creates AddressRequest row
3. Sends SMS/iMessage with a beautiful branded link: `kin.app/a/{token}`
4. Link is one-time use, expires in 7 days
5. Recipient opens link → beautiful web form (no account needed)
6. Recipient submits address → stored on the Person record, request marked complete
7. Below the form: "Want to know when [sender]'s birthday is? Create your free Kin."
8. If recipient creates account, their Person record gets `claimedByUserId` linked

### "You've Been Added" Notification

1. When User A adds a new contact with a phone number
2. System sends SMS: "Someone added you to their Kin circle 👀 See who: kin.app/added/{token}"
3. Recipient taps → must create account to see who added them (curiosity gap)
4. On account creation, they see who added them and are prompted to add their own friends

### Birthday Reminders

- Cron job runs daily, checks upcoming birthdays
- N days before (user-configurable): push notification + in-app notification
- Notification includes wishlist link if the person has one and user has Inner Circle access

### Wishlist + Purchase Tracking

- Each user can maintain a wishlist visible to their Inner Circle
- Inner Circle members can mark items as "purchased"
- "Purchased" status visible to all Inner Circle EXCEPT the wishlist owner
- Prevents duplicate gifts without spoiling surprise

### Address Freshness

- Each Person shows `addressVerifiedAt` timestamp
- Dashboard shows staleness indicator: green (<6 months), yellow (6-12 months), red (>12 months)
- "Ask to verify" button sends a verify request (same flow as address request but pre-filled)

### Database

- Neon Postgres via Vercel integration
- Drizzle ORM
- Env var: `DATABASE_URL`

### Deployment

- Web: Vercel (auto-deploy from GitHub)
- iOS: App Store (via Fastlane)

## Screens

### 1. Dashboard (Home)

- Timeline sidebar: upcoming birthdays/anniversaries
- Friend roster grid with tiered badges and freshness indicators
- Search pill for filtering
- "+ Add Person" button
- Notification bell with unread count

### 2. Friend Detail

- All info based on tier visibility
- Address with freshness indicator + "Ask to verify" button
- "Mark as caught up" button
- Wishlist preview (if Inner Circle)
- Edit/delete

### 3. Add Person

- Slide-out drawer with all fields
- Tier selector (Everyone/Friends/Inner Circle)
- Phone number field → triggers "you've been added" SMS
- Smart date input via chrono-node

### 4. Address Request

- "Request Address" button on any contact
- Compose step: add personal message, choose SMS or email
- Preview the branded message before sending
- Track: pending, completed, expired

### 5. Address Form (Public)

- Beautiful branded page at kin.app/a/{token}
- Shows sender name + personal message
- Address fields (street, city, state, zip)
- Optional: birthday, phone
- Below: "Create your free Kin" CTA

### 6. Wishlist

- User's own wishlist management
- Add items (title, URL, notes, priority)
- View friend's wishlist (if Inner Circle)
- "Mark as purchased" toggle (hidden from owner)

### 7. Settings

- Profile (name, phone, city, bio)
- Notification preferences
- Privacy (default tier for new connections)
- Connected accounts

### 8. Onboarding

1. Sign up with Google
2. Add phone number
3. "Add your first friend" or import contacts
4. Send first address request

## MVP Scope

1. Auth + onboarding (Clerk, Google OAuth, phone collection)
2. Add friends with tiered groups (Everyone/Friends/Inner Circle)
3. Address Request flow (send via SMS, beautiful web form)
4. "You've been added" curiosity notification (SMS)
5. Address form (public page for recipients)
6. Birthday reminders (in-app + notification)
7. Wishlists with purchase tracking
8. Address freshness indicators + verify nudge
9. iOS app with iMessage extension
10. Dashboard (warm analog design)

## Deferred (Phase 2+)

- Google Calendar sync
- Gmail email parsing (Zola/Partiful/Paperless Post)
- Calendar Library + AI builder
- Annual address refresh campaign (automated)
- Web Push notifications
- Contact import from phone
- Full native iOS app
- iMessage App Extension v2
- Gift purchasing integration
- "Haven't caught up" nudges
- Address validation API (USPS)
- Family sharing / shared address books

## Tech Stack

| Layer | Choice |
|-------|--------|
| Web Framework | Next.js 15 (App Router) |
| Auth | Clerk (Google OAuth) |
| Database | Neon Postgres (Vercel) |
| ORM | Drizzle |
| Styling | CSS Modules + design tokens |
| SMS | Twilio (address requests, "you've been added") |
| iOS | Swift (thin app, iMessage extension) |
| Deployment (web) | Vercel |
| Deployment (iOS) | App Store via Fastlane |
