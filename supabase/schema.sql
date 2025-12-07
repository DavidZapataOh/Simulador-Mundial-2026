-- Create a table for public user profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a trigger to automatically create a profile for new users
-- This triggers when a new user signs up via Supabase Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SIMULATIONS TABLE
create table if not exists simulations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text,
  data jsonb not null,
  champion_team_id text,
  votes_count bigint default 0,
  user_id uuid references auth.users(id)
);

-- Enable RLS on simulations
alter table simulations enable row level security;

-- Policy: Everyone can view simulations
create policy "Simulations are viewable by everyone"
  on simulations for select
  using ( true );

-- Policy: Only authenticated users can insert simulations
create policy "Authenticated users can create simulations"
  on simulations for insert
  to authenticated
  with check ( auth.uid() = user_id );

-- Policy: Users can only update their own simulations
create policy "Users can update own simulations"
  on simulations for update
  using ( auth.uid() = user_id );
