Applying the DB schema to your Supabase project

This project includes `db/schema.sql` which contains the tables, views, and RLS examples.

Recommended safe rollout steps

1) Rotate keys (IMPORTANT)
   - If you shared service role keys publicly, rotate them now in the Supabase dashboard.

2) Open Supabase SQL editor and create required extensions
   - Run the following (you can run it in the SQL editor):

```sql
-- enable gen_random_uuid
create extension if not exists "pgcrypto";
```

3) Apply schema
   - Open `db/schema.sql` in the Supabase SQL editor and run it.
   - Alternatively, use Supabase CLI:

```bash
# install supabase CLI if not already installed
# https://supabase.com/docs/guides/cli
supabase login
# select project
supabase db remote set <YOUR_DB_CONN_STRING>
# apply SQL file (example)
psql <your-db-connection-string> -f ./backend/db/schema.sql
```

4) Add RLS policies (if you plan to use anon client keys)
   - For sensitive tables (profiles, messages, join_requests, club_members) enable RLS:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Example: allow authenticated users to insert join requests
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "join_requests_insert" ON join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id or auth.role() = 'service_role');
```

Customize policies carefully for your app flows. The `db/schema.sql` contains commented examples you can adapt.

5) Create an initial admin / test user (optional)
   - Use Supabase Auth to sign up a user, then insert a row into `profiles` with that user's `id` (auth.users.id).

6) Test with anon key + RLS (optional)
   - After policies are in place, test from a client using SUPABASE_URL + SUPABASE_ANON_KEY; confirm reads/writes are limited to allowed rows.

If you want, I can generate an exact sequence of `psql` commands and a minimal script to run against your Supabase project — but I will NOT run them using any keys you pasted here; you should run them in your environment or paste safe deployment details.
