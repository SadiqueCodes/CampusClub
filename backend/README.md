# CampusClub Backend (server)

This folder contains a minimal production-ready backend scaffold that integrates with Supabase.

Important security note
- Do NOT commit any real Supabase keys to the repo.
- If you posted keys publicly, rotate them immediately in the Supabase dashboard and delete any leaked keys.

Overview
- Express + TypeScript server.
- Uses the Supabase "service_role" key server-side (read from env) to perform privileged operations.
- Database schema provided in `db/schema.sql` — run it from Supabase SQL editor or with your migration tooling.

Quick start (local)
1. Copy `.env.example` to `.env` and fill values (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).
2. Install deps from this folder:

```bash
cd backend
npm install
```

3. Run locally in dev mode:

```bash
npm run dev
```

What you'll find here
- `src/index.ts` - Express app and route mounting.
- `src/supabaseClient.ts` - server-side Supabase client wrapper (reads env vars).
- `src/routes/*` - example route handlers for clubs and events.
- `db/schema.sql` - SQL file with tables and recommended RLS policy examples.

Deploying
- Use your preferred host (Fly, Vercel serverless functions, Heroku, Render). Ensure env vars are set in the deployment.
- For serverless, prefer using the Supabase _service_ role on trusted backend only.

Next steps
- Wire frontend to read data from this backend or directly from Supabase (using anon keys) with row-level security.
- Add authentication/authorization middleware that verifies Supabase JWTs on protected routes (optionally use Supabase Auth helpers).
- Add migrations (pg-based or Supabase CLI) as needed.
