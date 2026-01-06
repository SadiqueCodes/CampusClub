-- CampusClub Supabase schema (run sequentially)

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  college_id text,
  college_name text,
  major text,
  year text,
  profile_photo text,
  interests text[] default '{}'::text[],
  clubs_joined text[] default '{}'::text[],
  clubs_leading text[] default '{}'::text[],
  events_attended int default 0,
  rating numeric default 0,
  total_transactions int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_select'
  ) then
    create policy "profiles_self_select" on public.profiles
      for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_upsert'
  ) then
    create policy "profiles_self_upsert" on public.profiles
      using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Clubs
create table if not exists public.clubs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  description text,
  leader_id uuid references public.profiles(id),
  leader_name text,
  member_ids uuid[] default '{}'::uuid[],
  member_count int default 0,
  created_at timestamptz default now(),
  group_chat_id uuid,
  logo text,
  logo_emoji text,
  cover_photo text,
  upcoming_events int default 0
);

alter table public.clubs enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'clubs_public_read' and tablename = 'clubs'
  ) then
    create policy "clubs_public_read" on public.clubs for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'clubs_leader_insert' and tablename = 'clubs'
  ) then
    create policy "clubs_leader_insert" on public.clubs for insert with check (auth.uid() = leader_id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'clubs_leader_update' and tablename = 'clubs'
  ) then
    create policy "clubs_leader_update" on public.clubs for update using (auth.uid() = leader_id);
  end if;
end $$;

-- Join requests
create table if not exists public.join_requests (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  user_name text,
  user_photo text,
  initiated_by text check (initiated_by in ('user','leader')),
  status text default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz default now(),
  responded_at timestamptz
);

alter table public.join_requests enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'join_requests_visible' and tablename = 'join_requests'
  ) then
    create policy "join_requests_visible" on public.join_requests
      for select using (
        auth.uid() = user_id
        or auth.uid() = (select leader_id from public.clubs where id = club_id)
      );
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'join_requests_create' and tablename = 'join_requests'
  ) then
    create policy "join_requests_create" on public.join_requests
      for insert with check (
        (initiated_by = 'user' and auth.uid() = user_id)
        or (initiated_by = 'leader' and auth.uid() = (select leader_id from public.clubs where id = club_id))
      );
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'join_requests_update' and tablename = 'join_requests'
  ) then
    create policy "join_requests_update" on public.join_requests
      for update using (
        auth.uid() = user_id
        or auth.uid() = (select leader_id from public.clubs where id = club_id)
      );
  end if;
end $$;

-- Events
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  club_id uuid references public.clubs(id) on delete cascade,
  club_name text,
  date timestamptz,
  time text,
  location text,
  banner_image text,
  interested_user_ids uuid[] default '{}'::uuid[],
  interested_count int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.events enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'events_public_read' and tablename = 'events'
  ) then
    create policy "events_public_read" on public.events for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'events_author_insert' and tablename = 'events'
  ) then
    create policy "events_author_insert" on public.events for insert with check (auth.uid() = created_by);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'events_author_update' and tablename = 'events'
  ) then
    create policy "events_author_update" on public.events for update using (auth.uid() = created_by);
  end if;
end $$;

-- Marketplace
create table if not exists public.marketplace_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price numeric not null,
  images text[] default '{}'::text[],
  seller_id uuid references public.profiles(id),
  seller_name text,
  seller_major text,
  seller_year text,
  seller_rating numeric default 0,
  status text default 'active' check (status in ('active','sold','reserved')),
  created_at timestamptz default now()
);

alter table public.marketplace_items enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_public_read' and tablename = 'marketplace_items'
  ) then
    create policy "marketplace_public_read" on public.marketplace_items for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_owner_insert' and tablename = 'marketplace_items'
  ) then
    create policy "marketplace_owner_insert" on public.marketplace_items for insert with check (auth.uid() = seller_id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_owner_update' and tablename = 'marketplace_items'
  ) then
    create policy "marketplace_owner_update" on public.marketplace_items for update using (auth.uid() = seller_id);
  end if;
end $$;

-- Chats
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  type text default 'group',
  name text,
  participant_ids uuid[] default '{}'::uuid[],
  last_message jsonb,
  last_message_time timestamptz,
  unread_count int default 0,
  club_id uuid references public.clubs(id) on delete cascade,
  marketplace_item_id uuid references public.marketplace_items(id) on delete cascade,
  avatar_emoji text,
  avatar_image text,
  created_at timestamptz default now()
);

alter table public.chats enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'chats_participant_select' and tablename = 'chats'
  ) then
    create policy "chats_participant_select" on public.chats
      for select using (auth.uid() = ANY(participant_ids));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'chats_participant_insert' and tablename = 'chats'
  ) then
    create policy "chats_participant_insert" on public.chats
      for insert with check (auth.uid() = ANY(participant_ids));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'chats_participant_update' and tablename = 'chats'
  ) then
    create policy "chats_participant_update" on public.chats
      for update using (auth.uid() = ANY(participant_ids));
  end if;
end $$;

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  sender_name text,
  text text,
  timestamp timestamptz default now(),
  attachments text[]
);

alter table public.messages enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'messages_participant_select' and tablename = 'messages'
  ) then
    create policy "messages_participant_select" on public.messages
      for select using (
        auth.uid() = ANY(
          coalesce(
            (select participant_ids from public.chats where id = chat_id limit 1),
            '{}'::uuid[]
          )
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'messages_participant_insert' and tablename = 'messages'
  ) then
    create policy "messages_participant_insert" on public.messages
      for insert with check (
        auth.uid() = ANY(
          coalesce(
            (select participant_ids from public.chats where id = chat_id limit 1),
            '{}'::uuid[]
          )
        )
      );
  end if;
end $$;

/*
-- Storage buckets (uncomment if your Supabase project supports storage.create_bucket)
select storage.create_bucket('marketplace');
select storage.create_bucket('profile-photos');
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_bucket_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "marketplace_bucket_read"
      on storage.objects for select using (bucket_id = 'marketplace');
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_bucket_insert' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "marketplace_bucket_insert"
      on storage.objects for insert with check (bucket_id = 'marketplace' and auth.uid() = owner);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'marketplace_bucket_update' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "marketplace_bucket_update"
      on storage.objects for update using (bucket_id = 'marketplace' and auth.uid() = owner);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'profile_bucket_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "profile_bucket_read"
      on storage.objects for select using (bucket_id = 'profile-photos');
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'profile_bucket_insert' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "profile_bucket_insert"
      on storage.objects for insert with check (bucket_id = 'profile-photos' and auth.uid() = owner);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'profile_bucket_update' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "profile_bucket_update"
      on storage.objects for update using (bucket_id = 'profile-photos' and auth.uid() = owner);
  end if;
end $$;
*/

-- Helper view
create or replace view public.club_with_leader as
select c.*, p.name as leader_name_from_profiles
from public.clubs c
left join public.profiles p on p.id = c.leader_id;
