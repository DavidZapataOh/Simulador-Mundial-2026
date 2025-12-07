-- Create Votes table
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  simulation_id uuid references public.simulations(id) on delete cascade not null,
  unique(user_id, simulation_id)
);

-- Enable RLS
alter table votes enable row level security;

-- Policies
create policy "Public can view votes" on votes
  for select using (true);

create policy "Authenticated users can vote" on votes
  for insert with check (auth.uid() = user_id);

create policy "Users can remove their own vote" on votes
  for delete using (auth.uid() = user_id);

-- Check if votes_count column exists in simulations, if not add it
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'simulations' and column_name = 'votes_count') then 
    alter table simulations add column votes_count integer default 0;
  end if; 
end $$;

-- Function to handle vote increment
create or replace function handle_new_vote()
returns trigger as $$
begin
  update public.simulations
  set votes_count = votes_count + 1
  where id = new.simulation_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new vote
drop trigger if exists on_vote_created on public.votes;
create trigger on_vote_created
  after insert on public.votes
  for each row execute procedure handle_new_vote();

-- Function to handle vote decrement (if un-voting is allowed later)
create or replace function handle_vote_removed()
returns trigger as $$
begin
  update public.simulations
  set votes_count = GREATEST(0, votes_count - 1)
  where id = old.simulation_id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger for removed vote
drop trigger if exists on_vote_deleted on public.votes;
create trigger on_vote_deleted
  after delete on public.votes
  for each row execute procedure handle_vote_removed();
