# CampusClub Security, Authentication, and Database Audit

Date: 2026-03-25

Scope reviewed:
- Frontend app config/env handling
- Backend auth middleware and API routes
- Supabase usage patterns and schema intent

## Executive Summary

The app has a working authentication flow, but backend authorization is not strict enough for production.  
The most important issue is that the backend uses a Supabase `service_role` client for all route queries, which bypasses RLS. This makes route-level authorization checks mandatory, and several endpoints currently miss those checks.

## Critical and High Issues

1. High: Unauthorized chat message read/write possible with valid token  
Files:
- `backend/src/routes/messages.ts`
- `backend/src/routes/chats.ts`

Details:
- `GET /api/messages?chatId=...` fetches messages by `chat_id` without verifying the requester is a participant in that chat.
- `POST /api/messages` inserts into any `chat_id` without verifying participant membership.
- Because backend uses service role, DB RLS does not protect this path.

Risk:
- Any authenticated user who can guess/obtain chat IDs may read or inject messages into other users' chats.

2. High: Join request listing leaks club applications to non-leaders  
File:
- `backend/src/routes/joinRequests.ts`

Details:
- `GET /api/join-requests?club_id=...` returns all join requests for that club.
- Code comment says leader check should happen, but it is not implemented.

Risk:
- Unauthorized access to membership applications and user metadata for clubs.

3. High: Route-level college isolation is inconsistent  
Files:
- `backend/src/routes/clubs.ts`
- `backend/src/routes/events.ts`
- `backend/src/routes/marketplace.ts`

Details:
- Public list endpoints return all records from backend.
- Product intent appears college-scoped, but backend currently does not enforce this on reads.
- With service-role backend access, the API can expose cross-college data unless manually filtered.

Risk:
- Data segregation failure between colleges.

## Medium Issues

4. Medium: Root `.env` is tracked in git  
Files:
- `.env`
- `.gitignore`

Details:
- `git ls-files` shows `.env` is versioned.
- `.env` currently includes real project configuration values.

Risk:
- Sensitive configuration leakage and accidental secret sharing in commits/history.

5. Medium: No API hardening middleware (rate limiting, Helmet, strict CORS allowlist)  
File:
- `backend/src/index.ts`

Details:
- `app.use(cors())` allows all origins.
- No request-rate controls.
- No secure headers middleware.

Risk:
- Higher abuse surface (spam, scraping, brute-force, automated misuse).

6. Medium: Insufficient input validation/sanitization on multiple routes  
Files:
- `backend/src/routes/*.ts`

Details:
- Most routes do minimal field checks.
- No schema validation library in use.

Risk:
- Data quality issues, malformed payload handling gaps, and elevated chance of authorization bypass via unexpected input shape.

## Low Issues

7. Low: Default Tenor API key is hardcoded fallback  
File:
- `backend/src/routes/gifs.ts`

Details:
- Uses public fallback key if env key is missing.

Risk:
- Reliability and quota issues more than direct security risk.

8. Low: Metadata trust during profile upsert  
File:
- `backend/src/middleware/auth.ts`

Details:
- Middleware upserts profile fields from token metadata on each request.

Risk:
- Unvalidated user metadata can pollute profile fields unless constrained elsewhere.

## What Needs Immediate Attention (Priority Order)

1. Lock message access by chat membership:
- In `messages.ts`, before select/insert, fetch chat by id and verify `participant_ids` includes `req.user.id`.

2. Enforce leader authorization in join-request list:
- In `joinRequests.ts`, for `club_id` query path, verify requester is the club leader before returning rows.

3. Enforce college scoping on all read endpoints:
- Filter by authenticated user's `college_id` where required by product policy.

4. Stop tracking root `.env`:
- Remove `.env` from git tracking, add `.env` to `.gitignore`, rotate keys if they were pushed to remote.

## Recommended Architecture Improvement

Current pattern:
- Backend uses `service_role` for all operations.

Safer pattern:
- Use user-scoped Supabase client for user-driven CRUD by forwarding JWT.
- Reserve service-role client for strictly admin/system operations only.
- Keep explicit authorization checks in backend for any privileged action.

## Additional Hardening Checklist

- Add `helmet`, strict CORS origin allowlist, and request rate limits.
- Add schema validation (Zod/Joi) for every request body/query.
- Add audit logs for privileged actions (club leadership changes, join-request decisions, deletes).
- Add security tests:
  - unauthorized chat read/write
  - unauthorized join-request access
  - cross-college data read attempts
- Add CI checks for secret leakage and dependency vulnerabilities.

## Final Assessment

The app is close to functional production behavior, but it is not yet security-ready.  
You should address the high issues before wider release, especially message authorization and join-request access control.
