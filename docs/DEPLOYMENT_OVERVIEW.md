# CampusClub Deployment Overview

## Live Links

- Backend API (Render): `https://campusclub-1.onrender.com`
- Backend health check: `https://campusclub-1.onrender.com/`
- Frontend app: Not deployed yet (currently run via Expo locally)
- Supabase project URL: `https://mmyrjfmlsvitfbamnujk.supabase.co`

## Project Summary

CampusClub is a mobile-first college community app built with Expo + React Native (frontend), an Express + TypeScript backend, and Supabase as the database/auth platform.

Main features:
- Club creation and management
- Event creation and discovery
- Marketplace listings
- Chat and messages
- User profiles and college-scoped data

## Architecture

- Frontend: React Native app in the repo root (`src/`)
- Backend: Node/Express service in `backend/`
- Database/Auth: Supabase (Postgres + Auth + RLS)

Flow:
1. App authenticates users with Supabase Auth.
2. App calls backend APIs for privileged or centralized operations.
3. Backend uses Supabase service role key server-side.
4. Data is stored in Supabase Postgres tables.

## Environment Variables

Frontend (root `.env`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `BACKEND_URL`
- `EXPO_PUBLIC_BACKEND_URL`

Backend (`backend/.env` on local or Render service env):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional, defaults to `8080`)

## Deployment Notes

- Backend host: Render Web Service
- Backend root directory on Render: `backend`
- Backend requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render Environment settings
- Frontend can point to deployed backend via:
  - `BACKEND_URL=https://campusclub-1.onrender.com`
  - `EXPO_PUBLIC_BACKEND_URL=https://campusclub-1.onrender.com`

## Security Reminder

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- If any key is leaked in git history or shared publicly, rotate it in Supabase immediately.
