-- Create profiles table for user data
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles are viewable by the user themselves
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add user_id column to quiz_results
alter table public.quiz_results 
add column user_id uuid references public.profiles(id) on delete cascade;

-- Update existing quiz_results to have a null user_id (they're orphaned)
-- In production, you might want to handle this differently

-- Drop old public policies
drop policy if exists "Anyone can insert quiz results" on public.quiz_results;
drop policy if exists "Quiz results are viewable by everyone" on public.quiz_results;

-- Create user-specific RLS policies for quiz_results
create policy "Users can view own quiz results"
on public.quiz_results
for select
using (auth.uid() = user_id);

create policy "Users can insert own quiz results"
on public.quiz_results
for insert
with check (auth.uid() = user_id);

create policy "Users can update own quiz results"
on public.quiz_results
for update
using (auth.uid() = user_id);

create policy "Users can delete own quiz results"
on public.quiz_results
for delete
using (auth.uid() = user_id);