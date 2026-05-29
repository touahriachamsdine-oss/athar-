-- Complete Postgres Schema for Athar
-- Run in SQL Editor

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text unique,
  wilaya text,
  neighborhood text,
  avatar_url text,
  role text not null default 'member' check (role in ('member','admin','superadmin')),
  impact_points integer not null default 0,
  lang text not null default 'ar' check (lang in ('ar','fr','en')),
  theme text not null default 'dark' check (theme in ('dark','light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.initiatives (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_fr text not null, title_en text not null,
  description_ar text, description_fr text, description_en text,
  category text not null default 'other',
  wilaya text not null, neighborhood text not null,
  status text not null default 'planning' check (status in ('planning','active','at-risk','completed')),
  health_score integer not null default 0 check (health_score between 0 and 100),
  current_step integer not null default 1 check (current_step between 1 and 5),
  created_by uuid references public.profiles(id) on delete set null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.initiative_members (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(initiative_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  step_number integer not null,
  title_ar text not null, title_fr text not null, title_en text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title_ar text not null, title_fr text not null, title_en text not null,
  body_ar text, body_fr text, body_en text,
  is_read boolean not null default false,
  initiative_id uuid references public.initiatives(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.initiatives enable row level security;

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Approved initiatives viewable by all" on initiatives for select using (is_approved = true);

-- Functions
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'), new.raw_user_meta_data->>'phone');
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- New Tables for Clubs, Training, and Consultations
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_fr text not null,
  name_en text not null,
  description_ar text,
  description_fr text,
  description_en text,
  category text not null check (category in ('robotics', 'programming', 'theater', 'reading', 'other')),
  wilaya text not null,
  created_at timestamptz not null default now()
);

create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique(club_id, user_id)
);

create table public.training_courses (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_fr text not null,
  title_en text not null,
  description_ar text,
  description_fr text,
  description_en text,
  instructor text,
  duration text,
  created_at timestamptz not null default now()
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.training_courses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'enrolled' check (status in ('enrolled', 'completed')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(course_id, user_id)
);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  is_public boolean not null default false,
  subject text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'answered', 'closed')),
  answer text,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

