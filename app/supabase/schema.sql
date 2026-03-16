-- HALO Database Schema
-- Run this in the Supabase SQL editor after creating your project

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════════
-- USERS (extends Supabase auth.users)
-- ══════════════════════════════════════════════
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamptz default now(),
  onboarding_complete boolean default false,
  onboarding_method text check (onboarding_method in ('chat', 'scan')),
  location_lat double precision,
  location_lng double precision,
  location_updated_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
create policy "Users can insert own data" on public.users for insert with check (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════
-- PROFILES (IRIS-generated personality data)
-- ══════════════════════════════════════════════
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  summary text,
  eq_score integer,
  traits jsonb default '[]'::jsonb,
  personality_nodes jsonb default '[]'::jsonb,
  personality_edges jsonb default '[]'::jsonb,
  intent_profile jsonb default '{}'::jsonb,
  core_values jsonb default '[]'::jsonb,
  raw_conversation jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
-- Allow reading other profiles for matching (service role bypasses RLS anyway)
create policy "Authenticated users can read profiles for matching" on public.profiles for select using (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════
-- MATCHES
-- ══════════════════════════════════════════════
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user_a_id uuid references public.users(id) on delete cascade not null,
  user_b_id uuid references public.users(id) on delete cascade not null,
  compatibility_score integer not null,
  shared_traits jsonb default '[]'::jsonb,
  iris_description text,
  status text default 'pending' check (status in ('pending', 'accepted_a', 'accepted_b', 'confirmed', 'declined', 'completed')),
  venue jsonb,
  meeting_time text,
  meeting_day text,
  conversation_starter text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.matches enable row level security;
create policy "Users can read own matches" on public.matches for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can update own matches" on public.matches for update using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- ══════════════════════════════════════════════
-- MATCH FEEDBACK
-- ══════════════════════════════════════════════
create table public.match_feedback (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  response text not null check (response in ('yes', 'no', 'maybe')),
  notes text,
  created_at timestamptz default now(),
  unique(match_id, user_id)
);

alter table public.match_feedback enable row level security;
create policy "Users can read own feedback" on public.match_feedback for select using (auth.uid() = user_id);
create policy "Users can insert own feedback" on public.match_feedback for insert with check (auth.uid() = user_id);
