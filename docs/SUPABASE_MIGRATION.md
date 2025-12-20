## CampusClub — Supabase integration & backend migration

This document explains what was implemented, what remains, the runtime errors observed while testing, and exact steps to fix them. It is written for the developer working on the project locally.

---

## 1) High-level summary — what I implemented

- Backend scaffold (Express + TypeScript) in `backend/` with a Supabase service client and a set of REST endpoints for clubs, chats, messages, etc.
- Database schema SQL provided at `backend/db/schema.sql` (tables: `profiles`, `clubs`, `club_members`, `join_requests`, `events`, `marketplace_items`, `chats`, `messages`).
- Frontend wiring to Supabase:
  - `src/lib/supabase.ts` — Supabase client updated to read env from Expo extras or `process.env`.
  - `src/lib/secureStore.ts` — SecureStore wrapper to persist sessions (fixed key prefix and validation).
  - `src/lib/api.ts` — HTTP helpers: `postMessage`, `postMessageSmart`, `postMessageDirect`, `createClub`, `createChat`, `updateClub`.
  - `src/store/index.ts` — Zustand store: auth (sign-up, magic link, session restore), realtime message subscriptions, optimistic messaging, retry/backoff, guards to avoid DB queries for non-UUID chat IDs.
  - `app.config.js` — injects `.env` values into `Constants.expoConfig.extra` for Expo dev runtime.
  - Screens updated to persist clubs/chats via backend (e.g. `src/screens/CreateClubScreen.tsx`) and to surface pending/failed message states (e.g. `ChatDetailScreen.tsx`).

All edits were made on branch `feat/backend2`.

## 2) Files added/changed (quick list)
- backend/
  - `backend/src/*` (Express app, routes, Supabase server client)
  - `backend/db/schema.sql`
- frontend/
  - `app.config.js` (reads `.env` and sets Expo extras)
  - `src/lib/supabase.ts`
  - `src/lib/secureStore.ts`
  - `src/lib/api.ts`
  - `src/types/expo-constants.d.ts`
  - `src/store/index.ts` (major changes)
  - `src/screens/CreateClubScreen.tsx`, `src/screens/ChatDetailScreen.tsx` (minor updates)

If you'd like, I can list exact diffs or open particular files next.

## 3) Errors observed while running the app and root causes

1) Network requests failing from device/emulator

- Error (observed in Metro logs):

  WARN  sendMessage attempt 0 failed [TypeError: Network request failed]
  DEBUG [api] POST http://localhost:8080/api/messages

- Root cause: The running app on a device/emulator tried to POST to `http://localhost:8080`. "localhost" resolves to the device itself, not your Mac. The backend is running on your Mac, so the address the device should call must be the Mac's reachable address.

2) Postgres invalid UUID errors when fetching messages for local chat IDs

- Error (observed in Metro logs):

  ERROR fetchMessagesForChat error {"code":"22P02","message":"invalid input syntax for type uuid: \"chat_1766223704996\""}

- Root cause: Some parts of the app create local-only chat IDs (like `chat_1766223704996`) before persisting to the DB. When the code attempted to query the database with that non-UUID string, Postgres rejected it because `chat_id` in the DB is a UUID column. The store now guards DB calls and realtime subscriptions and only runs them for UUID-looking IDs.

## 4) How to fix the immediate blocking issue (Network request failed)

Goal: Make the mobile runtime reachable by the backend URL the app uses.

Options (pick one):

- A — Use your Mac's LAN IP (recommended for physical devices and easy debugging)
  1. Ensure backend listens on all interfaces (0.0.0.0). Example in `backend` dev run:

     ```bash
     # from repo root
     cd backend
     HOST=0.0.0.0 PORT=8080 npm run dev
     ```

     Or ensure `app.listen(port, '0.0.0.0')` in your Express app.

  2. Get your Mac's LAN IP (Wi‑Fi):

     ```bash
     ipconfig getifaddr en0   # common for Wi‑Fi on macOS
     # fallback
     ipconfig getifaddr en1
     # generic fallback
     ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -n1
     ```

     Example result: `192.168.1.42`.

  3. Create or edit `.env` at the project root and set:

     ```text
     BACKEND_URL=http://192.168.1.42:8080
     SUPABASE_URL=https://<your-supabase>.supabase.co
     SUPABASE_ANON_KEY=<anon-key>
     ```

  4. Restart Expo/Metro so `app.config.js` picks up the new `.env` values:

     ```bash
     # from repo root
     npm start
     # or
     expo start --tunnel  # optional
     ```

  5. Verify from the phone or another device on the LAN:

     ```bash
     curl http://192.168.1.42:8080/api/   # or /api/messages
     ```

- B — Android emulator (AVD): use `http://10.0.2.2:8080` as `BACKEND_URL`.

- C — iOS Simulator: usually `http://localhost:8080` works (simulator shares the host network). If it doesn't, use the Mac IP as in A.

- D — If you prefer not to wire local IPs, use a tunnel (ngrok or Expo Tunnel):

  - Start ngrok: `ngrok http 8080` and set `BACKEND_URL` to the printed `https://...` URL in your `.env`.
  - Or run `expo start --tunnel` and test via Expo's tunnel.

Firewall note: macOS firewall may block incoming connections; allow or open port 8080 for testing.

## 5) How to fix the invalid UUID Postgres errors (already partially fixed)

What I changed already:
- Guarded DB queries and realtime subscriptions in `src/store/index.ts` so they only run if the `chatId` looks like a UUID (regex test). This prevents Postgres from receiving non-UUID strings.

Recommended cleanups / next steps:
1. Prefer creating the DB chat row before using it in the UI: create the chat on the backend first, then open the chat screen (so the chatId is a DB UUID immediately). The `CreateClubScreen` now calls the backend to create a club+chat and stores the returned UUIDs.
2. If local optimistic chat IDs are needed, ensure code paths that query the DB check for UUID format (already implemented), and whenever the backend returns the real UUID, reconcile (replace) the local chat and migrate messages.

## 6) Quick verification steps (smoke test)

1. Start the backend bound to 0.0.0.0 and listening on port 8080.
2. Set `.env` with `BACKEND_URL` set to the Mac IP (or emulator address) and restart Expo.
3. In the app:
   - Sign up / sign in.
   - Create a club (this should call backend and return a club row with `group_chat_id`).
   - Open the club chat and send a message. The message should POST to `BACKEND_URL/api/messages` and appear in the UI. Monitor Metro logs for any `Network request failed` warnings.

## 7) Optional small repo changes I can apply for convenience

1. Make `src/lib/api.ts` default `BACKEND_URL` to an empty string (`''`) instead of `http://localhost:8080`. That makes the app automatically fall back to direct Supabase insertion when `BACKEND_URL` is unspecified (avoids device-localhost confusion). I can patch this quickly.

2. Add platform-aware default in `src/lib/api.ts` (auto use `10.0.2.2` for Android emulator) — I can implement this if you often use Android emulators.

3. Add a short `docs/DEV_ENV.md` with exact commands to start backend and frontend for device testing. (I can create this too.)

If you want any of these applied, tell me which and I'll patch and run a quick `npx tsc --noEmit` to validate.

## 8) Next steps for production hardening (recommended)

- Finalize and enable RLS policies in Supabase (the SQL file has examples but you must adapt and enable policies in Supabase UI).
- Add server-side validation and rate limiting (backend routes are currently minimal).
- Add tests and CI: unit tests for backend routes and end-to-end smoke test for the messaging flow.
- Add migration/versioning (e.g., using `supabase migrations` or `sqitch`/`node-pg-migrate`).
- Securely store service role key (do NOT commit to repo). Use platform secrets for deploy.

---

If you'd like, I can now:

- (1) patch `src/lib/api.ts` to make `BACKEND_URL` default to `''` (safer for devices), run typecheck, and commit the change; or
- (2) look up your machine IP and suggest the exact `.env` value (I can run the ip lookup command for you); or
- (3) create a `docs/DEV_ENV.md` with runnable commands to start both backend and frontend and a checklist to test messaging.

Tell me which (1/2/3) you want next and I'll do it.
