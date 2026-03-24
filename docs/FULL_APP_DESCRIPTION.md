# CampusClub - Full App Description

## 1. App Overview
CampusClub is a college-community mobile app built with Expo React Native + TypeScript.  
It combines:

- Club discovery and joining
- Club chat and member invites
- Event creation and management
- Marketplace listings
- User profile and account settings

Data is powered by Supabase (auth, database, realtime, storage), with an optional Express backend for protected API workflows.

---

## 2. How Many Sections the App Has

## 2.1 Main Bottom-Tab Sections (5)
The app has **5 primary tab sections**:

1. `Search`
2. `Events`
3. `Home`
4. `Clubs`
5. `Profile`

These are defined in `src/navigation/TabNavigator.tsx`.

## 2.2 Routed Screens in Navigation (13)
Inside tab stacks, there are **13 routed screens**:

1. `SearchClubs`
2. `EventsList`
3. `ManageEvent`
4. `HomeMain`
5. `AddEvent`
6. `EventDetail`
7. `Notifications`
8. `Marketplace`
9. `MarketplaceDetail`
10. `CreateClub`
11. `ClubChatDetail`
12. `ProfileHome`
13. `ProfileSettings`

## 2.3 Auth / Non-Tab Screens
- `LoginScreen` (used as auth gate in `App.tsx`)
- `WelcomeScreen` exists as a separate screen file, but current app launch flow uses `LoginScreen` directly.

---

## 3. App Shell and Startup Flow

## 3.1 Entry (`App.tsx`)
On app launch:

1. App initializes auth state from secure storage (`initializeAuth` in store).
2. It also handles deep links for Supabase magic-link tokens.
3. If auth is loading -> spinner screen.
4. If authenticated -> `TabNavigator`.
5. If not authenticated -> `LoginScreen`.

## 3.2 Auth Persistence
- Session tokens are saved in Expo SecureStore (`src/lib/secureStore.ts`).
- On restart, app restores session and fetches initial data.

---

## 4. Login and Signup Page (How It Looks + How It Works)

The login/signup page is implemented in `src/screens/LoginScreen.tsx`.

## 4.1 Visual Style
- Full-screen pink gradient hero background.
- Curved white lower section.
- Animated feature cards in header area.
- Multi-step signup form with modern card/chip styling.
- Uses custom font (`Lobster`) for title branding.

## 4.2 Sign In
Sign-in form includes:

- Email field
- Password field (show/hide toggle)
- Remember-me UI
- Login button

Behavior:

- Calls store `signIn({ email, password })`.
- Uses Supabase auth password sign-in.
- Pulls profile from `profiles` table.

## 4.3 Sign Up (3 Steps)
Signup is multi-step:

1. Basic info:
   - Full name
   - College email
   - Password + confirm
2. Campus details:
   - College selector (from Supabase `colleges`)
   - Major
   - Year
   - Semester
3. Interests:
   - Interest chip selection

Important behavior:

- College search is powered by Supabase query to `colleges`.
- Signup writes profile info via store `signUp(...)`.
- Uses selected college id/name for same-college filtering logic.

---

## 5. Section-by-Section Functional Description

## 5.1 Home Section (`HomeScreen`)
Purpose: dashboard for clubs, events, and marketplace.

UI blocks:

1. Gradient header with app title + notification icon
2. Top clubs carousel
3. Upcoming events list
4. Marketplace grid + add-listing card

What it does:

- Calls `fetchInitialData()` on mount/focus.
- Shows notification badge from pending requests/invites.
- Creates marketplace listing via modal (title, description, image, price).
- Navigates to:
  - Notifications
  - Add Event
  - Event Detail
  - Marketplace list/detail

---

## 5.2 Search Section (`SearchClubsScreen`)
Purpose: discover clubs and send join requests.

UI:

- Gradient header
- Search bar
- Club cards with stats and CTA button

What it does:

- Filters by club name/description/type.
- Creates join request (`initiatedBy: 'user'`) using store `createJoinRequest`.
- Disables button when request already pending.

---

## 5.3 Events Section (`EventsScreen` + `ManageEventScreen`)
Purpose: show and manage events created by current user.

`EventsScreen`:

- Shows only events where `event.createdBy === currentUser.id`.
- Empty state if no events.
- Opens `ManageEvent` for a selected event.

`ManageEventScreen`:

- Event stats cards (registered/interested/capacity)
- Details block (date, location, organizer)
- Attendee list
- Editable modal for date/time/location/capacity

Store interaction:

- Uses `updateEvent`.
- Profile lookups for attendees from `profiles` table.

---

## 5.4 Add Event / Event Detail

`AddEventScreen`:

- Form fields: poster, event name, description, organizer club, capacity, location, date, time.
- Calls `createEvent` in store.

`EventDetailScreen`:

- Shows banner, organizer badge, date/time/location cards, description.
- Supports interest toggle (`toggleEventInterest`).
- Register button currently triggers confirmation alert UI.

---

## 5.5 Clubs Section (`CreateClubScreen`)
Purpose: create clubs, access club chats, invite members.

Modes:

1. Club chat list mode:
   - Shows my clubs as chat cards.
   - Open chat detail.
   - Quick button to add members.
2. Create-club modal:
   - Club name, type, description.
3. Swipe invite mode:
   - Tinder-style user cards.
   - Swipe right sends invite join-request (`initiatedBy: 'leader'`).

Create flow:

- If backend configured: creates club/chat via API.
- If backend not configured: creates via direct Supabase + fallback local state.

Invite candidate source:

- Backend endpoint `/api/users/same-college` when backend URL exists.
- Supabase `profiles` fallback query by same `college_id` when backend is absent.

---

## 5.6 Chat Detail (`ChatDetailScreen`)
Purpose: messaging within a club/direct chat.

Features:

- Messages list with own/other/system bubble styles.
- Composer with send button.
- Optimistic sending + retry/backoff.
- Realtime subscription for DB-backed chat UUIDs.
- Chat action menu:
  - View description
  - View members
  - Rename club (leader)
  - Club events
  - Exit club
  - Change avatar emoji/image

Data behavior:

- Loads messages from Supabase `messages`.
- Subscribes to realtime inserts per `chat_id`.
- Updates chat last-message metadata.

---

## 5.7 Notifications (`NotificationsScreen`)
Purpose: manage all join/invite workflows.

Panels:

1. Invitations for me
2. My applications
3. Incoming requests (for clubs I lead)
4. Invites I sent

Actions:

- Accept/decline invite
- Accept/decline application
- Cancel request/invite
- On acceptance: adds user to club and chat participant list, persists chat participants.

---

## 5.8 Marketplace (`MarketplaceScreen` + `MarketplaceDetailScreen`)
Purpose: campus buy/sell listings.

`MarketplaceScreen`:

- Search listings by title/description/seller
- Grid of listing cards
- Open item detail

`MarketplaceDetailScreen`:

- Image/placeholder
- Status badge
- Price + seller info
- Contact seller CTA

Creation path:

- Listing creation is from Home modal.
- Supports image upload to Supabase Storage via `src/lib/storage.ts`.

Realtime:

- Store subscribes to `marketplace_items` insert/update/delete events.

---

## 5.9 Profile (`ProfileScreen`) and Settings (`SettingsScreen`)

`ProfileScreen`:

- Header with college
- Avatar + identity info
- Snapshot chips (clubs/events/listings)
- My clubs list with leader badge
- Listings preview
- Logout

`SettingsScreen`:

- Edit profile fields: name, email, major, college ID, year, interests, photo
- Saves updates to store `setCurrentUser` (client-side state update)

Fallback safety:

- If profile user object is temporarily unavailable, screen shows fallback state instead of blank render.

---

## 6. State Management and Data Flow

All core app logic is in `src/store/index.ts` (Zustand):

- Auth: login, signup, session restore, logout
- Clubs: fetch/add/update/member add
- Events: fetch/create/update/interest toggle
- Marketplace: fetch/create/update/realtime subscription
- Chats: fetch/add/update/send/fetch messages/realtime subscribe/unsubscribe
- Join requests: fetch/create/update + notification helper

`fetchInitialData()` orchestrates main initial loads:

- clubs
- events
- marketplace
- chats (if authenticated)
- join requests (if authenticated)

---

## 7. Backend (Optional but Included)

Backend folder: `backend/`

Stack:

- Express + TypeScript
- Supabase server client with service-role key

Routes:

- `GET/POST /api/clubs`
- `GET/POST /api/events`
- `GET/POST /api/marketplace`
- `GET/POST /api/chats`
- `GET/POST /api/messages`
- `GET/POST /api/join-requests`
- `GET /api/users/same-college`

Auth:

- `requireAuth` middleware validates Supabase JWT.
- `requireLeader` middleware protects leader-only club updates.

---

## 8. Supabase Schema (Core Tables)

Defined in `backend/db/schema.sql`:

1. `profiles`
2. `colleges`
3. `clubs`
4. `join_requests`
5. `events`
6. `marketplace_items`
7. `chats`
8. `messages`

RLS policies enforce:

- self profile access
- same-college data visibility
- participant/owner-based access for chats/messages/marketplace

---

## 9. Design and UX Characteristics

- High-contrast gradient headers and rounded cards.
- Pink/magenta themed branding used across most surfaces.
- Card-heavy visual hierarchy with shadows and pills/chips.
- Multi-modal interactions (swipe cards, modals, popovers, date/time pickers).

---

## 10. Current Architecture Behavior (Important)

The app is intentionally hybrid:

1. **Supabase-first**: core reads/writes work directly from mobile app.
2. **Backend-optional**: if `BACKEND_URL` is set, some flows use backend APIs.
3. **Fallback paths**: for several critical workflows, app falls back to direct Supabase when backend is unavailable.

This allows development to continue even when backend is offline, while still supporting production backend architecture.

---

## 11. Files to Read for Quick Orientation

- App shell: `App.tsx`
- Navigation: `src/navigation/TabNavigator.tsx`
- Main state: `src/store/index.ts`
- Auth UI: `src/screens/LoginScreen.tsx`
- Home: `src/screens/HomeScreen.tsx`
- Clubs/invites: `src/screens/CreateClubScreen.tsx`
- Chat detail: `src/screens/ChatDetailScreen.tsx`
- Notifications: `src/screens/NotificationsScreen.tsx`
- Backend entry: `backend/src/index.ts`
- DB schema: `backend/db/schema.sql`

