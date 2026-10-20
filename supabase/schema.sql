-- InterviewX initial schema. Run in Supabase SQL Editor before deployment.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null default '',
  role text not null default '',
  job_description text not null default '',
  mode text not null default 'target' check (mode in ('target','practice')),
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  feedback jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists interviews_user_created_idx on public.interviews(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "interviews select own" on public.interviews;
create policy "interviews select own" on public.interviews for select to authenticated using (auth.uid() = user_id);
drop policy if exists "interviews insert own" on public.interviews;
create policy "interviews insert own" on public.interviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "interviews update own" on public.interviews;
create policy "interviews update own" on public.interviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "interviews delete own" on public.interviews;
create policy "interviews delete own" on public.interviews for delete to authenticated using (auth.uid() = user_id);

-- Private resume bucket. Uploads are restricted to a user's own folder named by auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes','resumes',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "resume upload own folder" on storage.objects;
create policy "resume upload own folder" on storage.objects for insert to authenticated with check (bucket_id='resumes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "resume read own folder" on storage.objects;
create policy "resume read own folder" on storage.objects for select to authenticated using (bucket_id='resumes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "resume delete own folder" on storage.objects;
create policy "resume delete own folder" on storage.objects for delete to authenticated using (bucket_id='resumes' and (storage.foldername(name))[1] = auth.uid()::text);
