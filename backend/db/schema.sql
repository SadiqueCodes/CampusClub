-- CampusClub database schema for Supabase (Postgres)
-- Run this in the Supabase SQL editor or via migrations.

-- NOTE: This schema assumes you're using Supabase Auth (auth.users) for authentication.
-- We'll store user profile info in a `profiles` table linked to auth.users.

-- 1) Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade,
  name text,
  email text,
  college_id text,
  college_name text,
  major text,
  year text,
  profile_photo text,
  interests jsonb,
  clubs_joined uuid[] default array[]::uuid[],
  clubs_leading uuid[] default array[]::uuid[],
  events_attended integer default 0,
  rating numeric default 0,
  total_transactions integer default 0,
  created_at timestamptz default now(),
  primary key (id)
);

-- 2) Clubs
create table if not exists clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text,
  description text,
  leader_id uuid references profiles(id),
  leader_name text,
  member_count integer default 0,
  created_at timestamptz default now(),
  group_chat_id uuid,
  logo text,
  logo_emoji text,
  cover_photo text,
  upcoming_events integer default 0
);

-- 3) Club members (normalized)
create table if not exists club_members (
  club_id uuid references clubs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (club_id, user_id)
);

create index if not exists idx_club_members_user on club_members(user_id);
create index if not exists idx_club_members_club on club_members(club_id);

-- 4) Join requests
create table if not exists join_requests (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references clubs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  user_name text,
  user_photo text,
  initiated_by text, -- 'user' | 'leader'
  status text default 'pending', -- pending | accepted | rejected | cancelled
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists idx_join_requests_club on join_requests(club_id);
create index if not exists idx_join_requests_user on join_requests(user_id);

-- 5) Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  club_id uuid references clubs(id) on delete cascade,
  club_name text,
  date timestamptz,
  time text,
  location text,
  banner_image text,
  interested_user_ids uuid[] default array[]::uuid[],
  interested_count integer default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_events_club on events(club_id);
create index if not exists idx_events_date on events(date);

-- 6) Marketplace
create table if not exists marketplace_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric not null,
  images text[],
  seller_id uuid references profiles(id),
  seller_name text,
  seller_major text,
  seller_year text,
  seller_rating numeric,
  status text default 'active', -- active | sold | reserved
  created_at timestamptz default now()
);

create index if not exists idx_marketplace_seller on marketplace_items(seller_id);

-- 7) Chats and messages
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  type text default 'group', -- group | direct
  name text,
  participant_ids uuid[],
  last_message jsonb,
  last_message_time timestamptz,
  unread_count integer default 0,
  club_id uuid references clubs(id),
  marketplace_item_id uuid references marketplace_items(id),
  avatar_emoji text,
  avatar_image text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id),
  sender_name text,
  text text,
  timestamp timestamptz default now(),
  attachments text[]
);

create index if not exists idx_messages_chat on messages(chat_id);

-- 8) Example RLS policies (you MUST adapt these)
-- Enable RLS on tables that store user data if you intend to use client-side anon keys.

-- Example: enable RLS for profiles (so clients can only see their own profile by default)
-- Note: Replace or extend policies as appropriate for your app.

-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "profiles_self_or_public" ON profiles
--   FOR SELECT USING (auth.uid() = id OR true); -- adjust 'true' to a condition for public access

-- For club_members, allow users to insert a request via watch/edge or controlled server
-- ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Add other policies as required when using anon client keys.

-- 9) Helpful views or functions (optional)
-- Example: view for club with leader data
create or replace view club_with_leader as
select c.*, p.name as leader_name_from_profiles
from clubs c
left join profiles p on p.id = c.leader_id;

-- End of schema
