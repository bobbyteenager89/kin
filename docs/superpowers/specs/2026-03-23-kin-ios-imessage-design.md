# Kin iOS App + iMessage Extension — Design Spec

**Date:** 2026-03-23
**Status:** Approved

## Overview

Native iOS app for Kin with an iMessage extension that enables sending address requests directly from iMessage conversations. The app is a hybrid: key screens (dashboard, friend detail, onboarding) are native SwiftUI, while secondary screens (wishlist management, full settings) use in-app web views pointing to the existing Next.js web app.

The iMessage extension is the viral engine — it makes sending an address request a 2-tap action from within any iMessage conversation.

## Architecture

### Project Structure

```
~/Projects/kin-ios/
├── Kin.xcworkspace
├── Kin.xcodeproj/
├── Kin/
│   ├── KinApp.swift
│   ├── ContentView.swift              # Tab bar root
│   └── Config/
│       ├── Kin.entitlements            # App Groups, push notifications
│       └── Info.plist
├── KinMessages/
│   ├── MessagesViewController.swift   # UIKit MSMessagesAppViewController bridge
│   ├── ExtensionRootView.swift        # SwiftUI root
│   ├── Info.plist
│   └── KinMessages.entitlements       # App Groups
├── KinPackage/
│   ├── Package.swift
│   └── Sources/
│       ├── KinCore/                   # Shared: API client, auth, models
│       │   ├── APIClient.swift
│       │   ├── AuthManager.swift
│       │   ├── Models.swift
│       │   └── KeychainHelper.swift
│       ├── KinUI/                     # Shared SwiftUI components
│       │   ├── DesignTokens.swift
│       │   ├── StampAvatar.swift
│       │   ├── RosterRow.swift
│       │   └── SectionHeader.swift
│       ├── KinApp/                    # Main app screens
│       │   ├── DashboardView.swift
│       │   ├── FriendDetailView.swift
│       │   ├── OnboardingView.swift
│       │   ├── ContactImportView.swift
│       │   ├── AddPersonSheet.swift
│       │   └── WebViewScreen.swift
│       └── KinMessages/              # iMessage extension screens
│           ├── CompactView.swift
│           ├── ExpandedView.swift
│           └── MessageComposer.swift
```

### Key Architectural Decisions

- **Separate repo** (`~/Projects/kin-ios`) — iOS and web share the API, not code
- **Swift Package** pattern (proven in Frend) — `KinCore` shared between app and extension
- **App Groups** (`group.com.kinapp.shared`) — Keychain sharing for auth tokens
- **Next.js API as backend** — iOS calls `/api/mobile/*` routes, no separate backend
- **Clerk iOS SDK** for auth — Apple Sign In + Google Sign In

## Auth Flow

1. User opens Kin app → sign in screen (Apple or Google via Clerk iOS SDK)
2. Clerk returns session token
3. Token stored in App Group Keychain via `KeychainHelper`
4. All API calls: `Authorization: Bearer <clerk-session-token>`
5. iMessage extension reads token from shared Keychain — no separate login needed
6. Token refresh handled by Clerk SDK automatically

## API Layer

New REST routes on the Next.js backend (prefix `/api/mobile/`):

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/mobile/auth | Exchange Clerk token, ensure user row |
| GET | /api/mobile/persons | List user's contacts |
| POST | /api/mobile/persons | Create person |
| GET | /api/mobile/persons/:id | Person detail + children |
| PATCH | /api/mobile/persons/:id | Update person |
| DELETE | /api/mobile/persons/:id | Delete person |
| POST | /api/mobile/persons/:id/caught-up | Mark caught up |
| GET | /api/mobile/events/upcoming | Upcoming events for timeline |
| POST | /api/mobile/address-requests | Create address request |
| GET | /api/mobile/notifications | List notifications |
| POST | /api/mobile/notifications/read-all | Mark all read |
| POST | /api/mobile/push/register | Register APNs device token |
| GET | /api/mobile/contacts/match | Match phone numbers to Kin users |

All authenticated via Clerk session token. Returns JSON.

## iMessage Extension

### Compact Mode

The bar at the bottom of iMessage when Kin is selected from the app drawer.

- Detects current conversation partner's phone number via `MSConversation`
- Matches against user's Kin contacts (cached locally)
- **If match found:** Shows "📮 Request [Name]'s address" — one tap creates request + inserts bubble
- **If no match:** Shows "📮 Send address request" — tap expands to full view
- **Birthday bonus:** If matched contact has birthday within 7 days, shows "🎂 [Name]'s birthday in [N] days"

### Expanded Mode

Full-screen overlay when user taps to expand.

- Search bar to filter Kin contacts
- Scrollable list of contacts (RosterRow components)
- Tap contact → compose screen:
  - Personal message text field
  - Preview of what recipient sees
  - "Send Request" button
- Creates address request via API, inserts MSMessage bubble

### Message Bubble

Custom `MSMessageTemplateLayout`:
- **Image:** Kin branded card (paper background, serif text)
- **Title:** "🎁 [Sender] wants to send you something"
- **Subtitle:** "Tap to share your address"
- **URL:** `https://kin-steel.vercel.app/a/{token}`

When recipient taps → opens web form (works without Kin installed).
When sender taps own bubble → shows request status.

### Flow Diagram

```
COMPACT MODE                          EXPANDED MODE
┌─────────────────────────┐          ┌─────────────────────────┐
│ 📮 Request Sarah's addr │──tap──▶  │ Search contacts...      │
│ 🎂 Birthday in 3 days   │          │ ┌─────────────────────┐ │
└─────────────────────────┘          │ │ Clara Bow           │ │
         │                           │ │ Eleanor Vance       │ │
    one-tap sends                    │ │ Theodore Crain      │ │
         │                           │ └─────────────────────┘ │
         ▼                           │     ↓ tap contact       │
┌─────────────────────────┐          │ ┌─────────────────────┐ │
│ Message bubble inserted │          │ │ Message to Eleanor: │ │
│ in conversation         │          │ │ [                 ] │ │
└─────────────────────────┘          │ │   [Send Request]    │ │
                                     │ └─────────────────────┘ │
                                     └─────────────────────────┘
```

## Native App Screens

### Tab Bar (3 tabs)

1. **Home** — Dashboard (native SwiftUI)
2. **Wishlist** — WebView to `/wishlist`
3. **Settings** — Profile + notification toggle, links to web for full settings

### Dashboard (Home)

- Top: "Kin" serif logo + notification bell (unread count badge)
- Horizontal birthday timeline: stamp avatars, names in serif, dates in italic
- "ALL KIN" section: scrollable roster list with status dots
- Tap friend → pushes to FriendDetailView
- "+" button → AddPersonSheet
- Pull-to-refresh

### Friend Detail

- Bottom sheet style (matches web postcard design)
- Asterisk-shaped hero image clip-path
- Postcard layout: italic greeting left, stamp avatar right
- Address on form-line style (label + serif italic value)
- Freshness indicator (teal dot = fresh, grey = stale)
- "Send iMessage Request" button → opens compose in Messages app or triggers extension
- "Mark as caught up" button
- Edit/delete actions

### Onboarding

1. Welcome: "Kin" branding, tagline
2. Sign in: Apple Sign In + Google (Clerk iOS SDK)
3. Phone number: collect for SMS features
4. Contact import: request Contacts permission → match phone numbers via `/api/mobile/contacts/match` → show "Friends already on Kin" + suggest adding others
5. Add first friend: quick form (name, phone, relation)
6. Send first request: auto-creates address request for friend just added
7. Done → Dashboard

### Add Person Sheet

- `.sheet` presentation
- Name (required), phone, relation
- Tier selector: Everyone / Friends / Inner Circle
- Birthday date picker
- "More details" expandable: partner, anniversary, address, tags, notes
- Save calls POST `/api/mobile/persons`

## Push Notifications

- Register for APNs on app launch
- Store device token via POST `/api/mobile/push/register`
- Server sends push for:
  - Birthday reminders (configurable days before)
  - Address request completed ("Sarah shared her address!")
  - "You've been added to someone's circle"
- Uses APNs provider API from Next.js (via `apn` npm package or direct HTTP/2)

### Push Registration Schema Addition

Add to Drizzle schema:
```
pushTokens table: id, userId, token, platform ('ios'), createdAt
```

## Contact Import

- Request `CNContactStore` access during onboarding
- Extract phone numbers from all contacts
- Send batch to `/api/mobile/contacts/match` → returns which numbers are Kin users
- Display:
  - "Friends already on Kin" — show matched users, auto-add as contacts
  - "Invite to Kin" — show non-matched contacts with invite button (sends SMS)

## Design System (SwiftUI)

### Colors
```swift
static let bgPaper = Color(hex: "#FFFFFF")
static let bgPaperDark = Color(hex: "#F0F4F7")
static let inkDark = Color(hex: "#2C3E50")
static let inkLight = Color(hex: "#7F8C8D")
static let accentOlive = Color(hex: "#34495E")
static let accentRust = Color(hex: "#4A90E2")
static let accentTeal = Color(hex: "#1ABC9C")
```

### Typography
- **Display/names:** Cormorant Garamond, 18-28px, medium/semibold weight
- **Italic emphasis:** Cormorant Garamond italic for greetings, dates, values
- **UI text:** Inter (system font fallback), 10-14px, regular/medium
- **Section headers:** Inter 10px, uppercase, 0.1em tracking, ink-light

### Components
- **StampAvatar:** Square image, 2px corner radius, 1px border, 3px inner padding
- **RosterRow:** 44px square avatar + name in serif + meta with status dot
- **SectionHeader:** Uppercase tracking label

### Spacing
Matches web: xs=4, sm=8, md=16, lg=24, xl=32

## App Store Requirements

- **Bundle ID:** `com.kinapp.kin`
- **iMessage Extension Bundle ID:** `com.kinapp.kin.messages`
- **App Group:** `group.com.kinapp.shared`
- **Minimum iOS:** 17.0
- **Capabilities:** Push Notifications, App Groups, Contacts (usage description)

## Dependencies

- **Clerk iOS SDK** — `@clerk/clerk-ios` via SPM
- **No other external dependencies** — use URLSession, SwiftUI, Contacts framework natively

## What This Spec Does NOT Cover

- Full native wishlist management (uses web view)
- Full native settings (uses web view for most)
- Offline mode / local caching
- Widget (home screen birthday widget — Phase 2)
- Rich notification actions (Phase 2)
