# CampusClub Architecture & Design Guide

This document explains how the CampusClub experience is organized, which modules own each concern, and how the UI sections are ordered on every major screen so that designers and engineers can stay in sync.

---

## 1. Product Vision & Experience Pillars
- **Campus-first community graph** – connect students to clubs, events, chats, and marketplace listings inside a single app surface.
- **Actionable discovery** – every feed section is tappable and leads to deeper management flows (detail screens, creation modals, swipe invites).
- **Expressive, bold visuals** – each surface uses gradient-heavy hero areas, pill buttons, and white cards sitting on soft backgrounds to reinforce the “funky moody vibe” defined in `src/theme`.

---

## 2. High-Level Architecture

### 2.1 Application Shell (`App.tsx`)
- Expo + React Native entry.
- Wraps the app in `GestureHandlerRootView` and `NavigationContainer`.
- Reads `isAuthenticated` from the global store (`useStore`) to show either the login gate or the tab experience.

### 2.2 Navigation Graph (`src/navigation/TabNavigator.tsx`)
- **Bottom tab as root** with five destinations: `Chat`, `Events`, `Home`, `Clubs`, `Profile`.
- Each tab hosts its own stack:
  1. **HomeStack** – `HomeMain` → `AddEvent` → `EventDetail`.
  2. **EventsStack** – `EventsList` → `ManageEvent`.
  3. **ChatStack** – `ChatList` → `ChatDetail`.
  4. **ClubsStack** – single-screen stack for `CreateClub` (swipe mode lives inside the screen state machine).
  5. **Profile** – standalone screen (no nested stack yet).
- Active tab is visually centered with a raised gradient pill (Home) while other tabs use `Ionicons`.

### 2.3 State Management (`src/store/index.ts`)
- Zustand store keeps a single source of truth for:
  - **Auth** (`currentUser`, `isAuthenticated`, `login`, `logout`).
  - **Clubs** (collections, derived `myClubs`, CRUD helpers).
  - **Events** (list, add, update, interest toggles).
  - **Marketplace** (items + owner listings).
  - **Chats & Messages** (chat list, per-chat message buckets).
  - **Join Requests** (pending + moderation actions).
- UI components call hooks (e.g., `useStore((state) => state.events)`) so data flows top→down.
- Currently seeded with mock data inside screens; ready to swap with API calls later.

### 2.4 Data Contracts (`src/types/index.ts`)
- Shared interfaces (`User`, `Club`, `Event`, `MarketplaceItem`, `Chat`, `Message`, `JoinRequest`, `SwipeProfile`) ensure that every layer (store, screens, components) stays strongly typed.

### 2.5 Theme System (`src/theme/index.ts`, `src/theme/colors.ts`)
- Central palette with gradient presets per surface (`home`, `create`, `chat`, `profile`, `auth`).
- Scales for spacing, radii, typography, shadows, and animation timings keep visuals consistent.

---

## 3. Module Map
| Folder | Responsibility |
| --- | --- |
| `src/components` | Shared UI primitives (`Button`, `Card`, `Input`, `SwipeCard`) used across screens. |
| `src/screens` | Feature surfaces (auth, core tabs, detail/manage flows). |
| `src/navigation` | Tab + stack routing definition. |
| `src/store` | Global state container and pure business logic. |
| `src/theme` | Design tokens (colors, spacing, gradients). |
| `src/types` | TypeScript interfaces shared project-wide. |
| `assets` | Static imagery/fonts leveraged by Expo bundler. |

---

## 4. Screen Layout & Section Ordering

### 4.1 Auth Flow (`LoginScreen.tsx`, optional `WelcomeScreen.tsx`)
1. **Full-screen gradient hero** – matches `auth` palette, contains logo + playful copy.
2. **Credential stack** – `Input` fields for college email and ID.
3. **Primary CTA** – `Button` triggers `login(email, collegeId)` and transitions to the tab navigator.
4. **Helper links** – secondary actions (forgot ID, sign up) can sit under the CTA if enabled.

### 4.2 Home Tab (`HomeScreen.tsx`)
1. **Header gradient** – brand greeting + notification icon pinned to the top with rounded bottom edges.
2. **Top Clubs carousel** – horizontal `FlatList` of gradient cards (Apply button in each), immediately following the header to encourage engagement.
3. **Upcoming Events stack** – vertical list of cards; `Add` FAB chip appears in the section header only if the viewer leads a club. Each card opens `EventDetail`.
4. **Marketplace grid** – two-column cards for items, concluding with an “Add Item” placeholder card to start a listing flow.
> Scroll order is strictly header → clubs carousel → events list → marketplace items, with consistent spacing defined by `styles.section`.

### 4.3 Events Tab (`EventsScreen.tsx`, `ManageEventScreen.tsx`)
1. **My Events header** – gradient strip with title.
2. **Empty state** (if no events) – icon + CTA text reminding users to create events from Home.
3. **Event cards list** – each entry shows title, club, date badge, interest count, and location. Pressing a card opens `ManageEvent` (edit, cancel, etc.).
4. **Manage Event flow** – card-like layout for event metadata, action buttons (edit, share, close), and join requests summary.

### 4.4 Home → Event Details (`AddEventScreen.tsx`, `EventDetailScreen.tsx`)
- **Add Event**: full-screen form with sections ordered as (1) title, (2) description, (3) schedule (date/time pickers), (4) location, (5) banner/media upload, (6) publish CTA.
- **Event Detail**: hero banner + date/time chip, followed by description, location map stub, and club metadata; final section offers primary action (mark interest/join) before related events.

### 4.5 Clubs Tab (`CreateClubScreen.tsx`)
1. **Overview list** – shows existing clubs (using cards) with stats for quick scanning.
2. **Create Club CTA** – gradient button launching the creation modal.
3. **Creation modal** – stacked inputs for name → type selector → description; submit triggers store updates and seeds a club chat.
4. **Swipe Mode (member invitations)** – replaces the whole screen after creation. Layout order: gradient progress header → swipe card deck → pass/like buttons anchored at bottom. When profiles are exhausted, an “All Done” confirmation card is displayed with navigation back to the club list.

### 4.6 Chat Tab (`ChatScreen.tsx`, `ChatDetailScreen.tsx`)
1. **Messages header** – gradient bar with title + search icon.
2. **Chat list** – vertically stacked cards output by `FlatList`. Each card includes:
   - Left: icon bubble indicating group vs. direct chat.
   - Middle: chat name/title row (with timestamp), message preview, optional tag (Marketplace).
   - Right: unread badge if `unreadCount > 0`.
3. **Chat detail** – stacked bubble layout: chronological message list, composer anchored at the bottom with attachment/send buttons.

### 4.7 Profile Tab (`ProfileScreen.tsx`)
1. **Profile hero** – gradient header, avatar monogram, and identity rows (email, major/year, college ID).
2. **Stats strip** – three cards (Clubs, Events, Listings).
3. **My Clubs** – list of club cards; “Leader” badge surfaces where `club.leaderId === currentUser.id`.
4. **My Listings** – vertical stack showing item icon, price, and status (Active/Sold).
5. **Logout button** – full-width gradient button pinned near the end of the scroll area.

### 4.8 Additional Surfaces
- **ChatDetailScreen** – uses the shared chat state to stream messages; inherits colors from the chat gradient palette.
- **WelcomeScreen** – optional pre-login experience that mirrors the brand gradient and educates users before hitting the login form.

---

## 5. Data & Interaction Flows

### 5.1 Authentication
1. `LoginScreen` collects email + college ID.
2. `useStore.getState().login` seeds `currentUser` and flips `isAuthenticated`.
3. `App.tsx` rerenders and mounts the `TabNavigator`.

### 5.2 Club Creation & Onboarding
1. User taps Create Club CTA (`CreateClubScreen`).
2. On submit, `addClub` mutates the store and `addChat` creates a group conversation tied via `clubId`.
3. Screen switches to swipe mode; inviting users would call `addJoinRequest` (stubbed for future backend).

### 5.3 Event Lifecycle
1. Club leaders hit the add icon on Home → `AddEventScreen`.
2. `addEvent` populates the store; created event appears immediately in `HomeScreen` and `EventsScreen`.
3. Tapping an event from Home pushes `EventDetail`.
4. Event owners can open `EventsScreen` → `ManageEvent` to edit or view engagement stats (based on `interestedCount`).

### 5.4 Marketplace → Chat Bridge
1. Marketplace cards live on the Home screen (final section).
2. Direct-chat rows show a `Marketplace` tag when `marketplaceItemId` is set, helping users jump from negotiation chats back to listing records.

---

## 6. Design Tokens & Visual Rhythm
- **Gradients** – Each screen uses the gradient defined in `theme.colors.gradients`. This ensures a recognizable color story (Home: violet, Create: amber, Chat: blue, Profile: purple, Auth: indigo).
- **Spacing** – Horizontal padding is standardized at 20 units; vertical gaps between sections follow `theme.spacing.lg` (16) or `xl` (20) to keep scroll rhythm consistent.
- **Cards** – All list items share rounded corners (`borderRadius.lg`), white backgrounds, and drop shadows (`theme.shadows.md`) to float against pastel backgrounds.
- **Iconography** – Ionicons provide consistent weight; header icons sit inside translucent pills for tactile affordance.

---

## 7. Extensibility Notes
- **Backend integration**: Replace mock data in `HomeScreen`, `ChatScreen`, etc., with API calls that hydrate the store via `setClubs`, `setEvents`, and `setChats`.
- **Push notifications**: Hook into `Notification` services to update `unreadCount` and show system-level alerts.
- **Search & filtering**: Each list section already isolates data in its own component; hooking a filter simply means deriving arrays before render.
- **Theming**: Because all colors/spacing live in `theme`, future re-skins can be shipped by editing token files without touching screen logic.

This guide should be used as the single reference when making design or architectural decisions so that every tab, section order, and interaction stays coherent.
