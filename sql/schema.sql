-- Complete Postgres Schema for Athar
-- Run in SQL Editor

create extension if not exists "pgcrypto";
-- pg_cron is Neon-managed and only creatable in the `postgres` DB context.
-- Nothing below hard-depends on it, so we enable it best-effort (cron-based
-- housekeeping jobs stay available when the operator targets `postgres`, and
-- the schema still applies cleanly against neondb/branches either way).
do $$ begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      create extension if not exists "pg_cron";
    exception when others then
      raise notice 'pg_cron skipped (expected outside the `postgres` DB context): %', sqlerrm;
    end;
  end if;
end $$;

create table if not exists public.profiles (
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

create table if not exists public.initiatives (
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

create table if not exists public.initiative_members (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(initiative_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  step_number integer not null,
  title_ar text not null, title_fr text not null, title_en text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
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

drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
drop policy if exists "Approved initiatives viewable by all" on initiatives;
create policy "Approved initiatives viewable by all" on initiatives for select using (is_approved = true);

-- Functions
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'), new.raw_user_meta_data->>'phone');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- New Tables for Clubs, Training, and Consultations
create table if not exists public.clubs (
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

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique(club_id, user_id)
);

create table if not exists public.training_courses (
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

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.training_courses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'enrolled' check (status in ('enrolled', 'completed')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  certificate_url text,
  unique(course_id, user_id)
);

create table if not exists public.consultations (
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

create table if not exists public.awareness_content (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_fr text not null,
  title_en text not null,
  description_ar text,
  description_fr text,
  description_en text,
  content_type text not null default 'article' check (content_type in ('article', 'video')),
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.school_visits (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  school_type text not null default 'middle' check (school_type in ('middle', 'high', 'primary')),
  wilaya text not null,
  visit_date timestamptz not null default now(),
  activity_type text not null default 'tour' check (activity_type in ('tour', 'workshop', 'presentation')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_email text not null,
  phone text,
  role text not null default 'member',
  token text not null unique,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS for new tables
alter table public.awareness_content enable row level security;
alter table public.school_visits enable row level security;
alter table public.invites enable row level security;

drop policy if exists "Awareness content viewable by all" on awareness_content;
create policy "Awareness content viewable by all" on awareness_content for select using (true);
drop policy if exists "Authenticated users can insert awareness content" on awareness_content;
create policy "Authenticated users can insert awareness content" on awareness_content for insert with check (true);
drop policy if exists "School visits readable by all" on school_visits;
create policy "School visits readable by all" on school_visits for select using (true);
drop policy if exists "Authenticated users can add school visits" on school_visits;
create policy "Authenticated users can add school visits" on school_visits for insert with check (true);
drop policy if exists "Invites readable by all" on invites;
create policy "Invites readable by all" on invites for select using (true);
drop policy if exists "Authenticated users can create invites" on invites;
create policy "Authenticated users can create invites" on invites for insert with check (true);
drop policy if exists "Invites can be updated by authenticated users" on invites;
create policy "Invites can be updated by authenticated users" on invites for update using (true);

-- ============================================================================
-- GRADE C HARDENING: helpers, full RLS, volunteer module, audit, atomic RPCs
-- ============================================================================

-- ---------- Authorization helpers (security definer, RLS-bypassing, no recursion) ----------
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

create or replace function public.is_initiative_member(p_initiative_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.initiative_members
    where initiative_id = p_initiative_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_initiative_leader(p_initiative_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.initiative_members
    where initiative_id = p_initiative_id
      and user_id = auth.uid()
      and role in ('founder','leader')
  );
$$;

-- Dependency note: initiative_of_session() must be declared AFTER the
-- volunteer_sessions table (it references it), so it lives here next to the
-- policies that consume it rather than in the auth-helper block above.
create or replace function public.initiative_of_session(p_session_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select initative_id from public.volunteer_sessions where id = p_session_id;
$$;

-- ---------- RLS for previously unprotected tables ----------
alter table public.initiative_members enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.training_courses enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.consultations enable row level security;

-- initiatives: creators/admins may insert/update/delete (was select-only)
drop policy if exists "Authenticated users can create initiatives" on initiatives;
create policy "Authenticated users can create initiatives" on initiatives
  for insert with check (auth.uid() is not null and created_by = auth.uid());
drop policy if exists "Creators or admins can update initiatives" on initiatives;
create policy "Creators or admins can update initiatives" on initiatives
  for update using (created_by = auth.uid() or public.is_platform_admin());
drop policy if exists "Creators or admins can delete initiatives" on initiatives;
create policy "Creators or admins can delete initiatives" on initiatives
  for delete using (created_by = auth.uid() or public.is_platform_admin());

drop policy if exists "Initiative members see membership" on initiative_members;
create policy "Initiative members see membership" on initiative_members for select
  using (public.is_initiative_member(initiative_id) or public.is_initiative_leader(initiative_id));
drop policy if exists "Join own or lead" on initiative_members;
create policy "Join own or lead" on initiative_members for insert
  with check (user_id = auth.uid() or public.is_initiative_leader(initiative_id));
drop policy if exists "Leaders can update membership" on initiative_members;
create policy "Leaders can update membership" on initiative_members for update
  using (public.is_initiative_leader(initiative_id));
drop policy if exists "Self or leaders can remove" on initiative_members;
create policy "Self or leaders can remove" on initiative_members for delete
  using (user_id = auth.uid() or public.is_initiative_leader(initiative_id));

drop policy if exists "Initiative members see tasks" on tasks;
create policy "Initiative members see tasks" on tasks for select
  using (public.is_initiative_member(initiative_id) or public.is_initiative_leader(initiative_id));
drop policy if exists "Leaders can create tasks" on tasks;
create policy "Leaders can create tasks" on tasks for insert
  with check (public.is_initiative_leader(initiative_id));
drop policy if exists "Leaders can update tasks" on tasks;
create policy "Leaders can update tasks" on tasks for update
  using (public.is_initiative_leader(initiative_id));
drop policy if exists "Leaders can delete tasks" on tasks;
create policy "Leaders can delete tasks" on tasks for delete
  using (public.is_initiative_leader(initiative_id));

drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications for select
  using (user_id = auth.uid());
drop policy if exists "Users can create own notifications" on notifications;
create policy "Users can create own notifications" on notifications for insert
  with check (user_id = auth.uid());
drop policy if exists "Users can mark own notifications read" on notifications;
create policy "Users can mark own notifications read" on notifications for update
  using (user_id = auth.uid());
drop policy if exists "Users can delete own notifications" on notifications;
create policy "Users can delete own notifications" on notifications for delete
  using (user_id = auth.uid());

drop policy if exists "Clubs are public" on clubs;
create policy "Clubs are public" on clubs for select using (true);
drop policy if exists "Admins create clubs" on clubs;
create policy "Admins create clubs" on clubs for insert
  with check (public.is_platform_admin());
drop policy if exists "Admins update clubs" on clubs;
create policy "Admins update clubs" on clubs for update
  using (public.is_platform_admin());
drop policy if exists "Admins delete clubs" on clubs;
create policy "Admins delete clubs" on clubs for delete
  using (public.is_platform_admin());

drop policy if exists "Members see own club membership" on club_members;
create policy "Members see own club membership" on club_members for select
  using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "Users join clubs themselves" on club_members;
create policy "Users join clubs themselves" on club_members for insert
  with check (user_id = auth.uid());
drop policy if exists "Users leave clubs" on club_members;
create policy "Users leave clubs" on club_members for delete
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Training courses are public" on training_courses;
create policy "Training courses are public" on training_courses for select using (true);
drop policy if exists "Admins create training courses" on training_courses;
create policy "Admins create training courses" on training_courses for insert
  with check (public.is_platform_admin());
drop policy if exists "Admins update training courses" on training_courses;
create policy "Admins update training courses" on training_courses for update
  using (public.is_platform_admin());
drop policy if exists "Admins delete training courses" on training_courses;
create policy "Admins delete training courses" on training_courses for delete
  using (public.is_platform_admin());

drop policy if exists "Users see own enrollments" on training_enrollments;
create policy "Users see own enrollments" on training_enrollments for select
  using (user_id = auth.uid());
drop policy if exists "Users enroll themselves" on training_enrollments;
create policy "Users enroll themselves" on training_enrollments for insert
  with check (user_id = auth.uid());
drop policy if exists "Users update own enrollments" on training_enrollments;
create policy "Users update own enrollments" on training_enrollments for update
  using (user_id = auth.uid());
drop policy if exists "Users delete own enrollments" on training_enrollments;
create policy "Users delete own enrollments" on training_enrollments for delete
  using (user_id = auth.uid());

drop policy if exists "Users see own or answered public consultations" on consultations;
create policy "Users see own or answered public consultations" on consultations for select
  using (user_id = auth.uid() or (is_public = true and status = 'answered'));
drop policy if exists "Authenticated users can consult" on consultations;
create policy "Authenticated users can consult" on consultations for insert
  with check (auth.uid() is not null and (user_id = auth.uid() or is_anonymous or user_id is null));
drop policy if exists "Owners or admins update consultations" on consultations;
create policy "Owners or admins update consultations" on consultations for update
  using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "Owners or admins delete consultations" on consultations;
create policy "Owners or admins delete consultations" on consultations for delete
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "School visit creators or admins update" on school_visits;
create policy "School visit creators or admins update" on school_visits for update
  using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "School visit creators or admins delete" on school_visits;
create policy "School visit creators or admins delete" on school_visits for delete
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Admins manage awareness content" on awareness_content;
create policy "Admins manage awareness content" on awareness_content for update
  using (public.is_platform_admin());
drop policy if exists "Admins remove awareness content" on awareness_content;
create policy "Admins remove awareness content" on awareness_content for delete
  using (public.is_platform_admin());

drop policy if exists "Invites can be updated by authenticated users" on invites;
drop policy if exists "Initiative leaders or admins update invites" on invites;
create policy "Initiative leaders or admins update invites" on invites for update
  using (public.is_initiative_leader(initiative_id));
drop policy if exists "Initiative leaders or admins delete invites" on invites;
create policy "Initiative leaders or admins delete invites" on invites for delete
  using (public.is_initiative_leader(initiative_id));

-- ---------- Volunteer module ----------
create table if not exists public.volunteer_sessions (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  title_ar text not null, title_fr text not null, title_en text not null,
  description_ar text, description_fr text, description_en text,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled','completed')),
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.volunteer_sessions(id) on delete cascade not null,
  volunteer_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'registered'
    check (status in ('registered','attended','no_show','cancelled')),
  attended_at timestamptz,
  hours numeric check (hours >= 0),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, volunteer_id)
);

create index if not exists volunteer_signups_session_idx on public.volunteer_signups (session_id);
create index if not exists volunteer_sessions_status_idx on public.volunteer_sessions (status, start_at);

alter table public.volunteer_sessions enable row level security;
alter table public.volunteer_signups enable row level security;

drop policy if exists "Approved or own or admin sessions visible" on volunteer_sessions;
create policy "Approved or own or admin sessions visible" on volunteer_sessions for select
  using (status = 'approved' or created_by = auth.uid() or public.is_platform_admin());
drop policy if exists "Volunteers see own signups or their session roster" on volunteer_signups;
create policy "Volunteers see own signups or their session roster" on volunteer_signups for select
  using (volunteer_id = auth.uid()
         or exists (select 1 from public.volunteer_sessions vs
                    where vs.id = session_id
                      and (vs.created_by = auth.uid() or public.is_initiative_leader(vs.initiative_id)))
         or public.is_platform_admin());

-- ---------- Audit log ----------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  entity text,
  entity_id text,
  success boolean not null default true,
  ip text, user_agent text, request_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists "Admins read the audit log" on audit_logs;
create policy "Admins read the audit log" on audit_logs for select
  using (public.is_platform_admin());

-- ---------- Atomic RPCs (security definer: RLS bypass, auth enforced inside) ----------
create or replace function public.create_volunteer_session(p_payload jsonb)
returns public.volunteer_sessions language plpgsql security definer set search_path = public as $$
declare
  v_initiative_id uuid := (p_payload ->> 'initiative_id')::uuid;
  v_session public.volunteer_sessions;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_initiative_leader(v_initiative_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.volunteer_sessions (
    initiative_id, title_ar, title_fr, title_en,
    description_ar, description_fr, description_en,
    location, start_at, end_at, capacity, created_by
  ) values (
    v_initiative_id,
    p_payload ->> 'title_ar', p_payload ->> 'title_fr', p_payload ->> 'title_en',
    p_payload ->> 'description_ar', p_payload ->> 'description_fr', p_payload ->> 'description_en',
    p_payload ->> 'location',
    (p_payload ->> 'start_at')::timestamptz,
    (p_payload ->> 'end_at')::timestamptz,
    greatest(coalesce((p_payload ->> 'capacity')::int, 1), 1),
    auth.uid()
  ) returning * into v_session;
  return v_session;
end; $$;

create or replace function public.signup_to_session(p_session_id uuid, p_volunteer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session public.volunteer_sessions;
  v_count int;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into v_session from public.volunteer_sessions where id = p_session_id;
  if v_session.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_session.status <> 'approved' then
    raise exception 'validation: session not approved' using errcode = '22023';
  end if;
  if v_session.end_at <= now() then
    raise exception 'validation: session has ended' using errcode = '22023';
  end if;
  if p_volunteer_id = v_session.created_by then
    raise exception 'validation: cannot sign up to own session' using errcode = '22023';
  end if;
  if exists (select 1 from public.volunteer_signups
             where session_id = p_session_id and volunteer_id = p_volunteer_id
               and status in ('registered','attended')) then
    return jsonb_build_object('status','registered');
  end if;
  select count(*) into v_count from public.volunteer_signups
    where session_id = p_session_id and status in ('registered','attended');
  if v_count >= v_session.capacity then
    raise exception 'validation: session full' using errcode = '23514';
  end if;
  if exists (select 1 from public.volunteer_signups
             where session_id = p_session_id and volunteer_id = p_volunteer_id
               and status = 'cancelled') then
    update public.volunteer_signups set status = 'registered'
      where session_id = p_session_id and volunteer_id = p_volunteer_id;
    return jsonb_build_object('status','registered');
  end if;
  insert into public.volunteer_signups (session_id, volunteer_id)
  values (p_session_id, p_volunteer_id);
  return jsonb_build_object('status','registered');
end; $$;

create or replace function public.cancel_signup(p_session_id uuid, p_volunteer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  update public.volunteer_signups
  set status = 'cancelled'
  where session_id = p_session_id and volunteer_id = p_volunteer_id and status = 'registered';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object('status','cancelled');
end; $$;

create or replace function public.mark_attendance(p_session_id uuid, p_volunteer_id uuid, p_attended boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_initiative_leader(public.initiative_of_session(p_session_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.volunteer_signups
  set status = case when p_attended then 'attended' else 'no_show' end,
      attended_at = case when p_attended then now() else null end
  where session_id = p_session_id and volunteer_id = p_volunteer_id and status = 'registered';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object('status', case when p_attended then 'attended' else 'no_show' end);
end; $$;

create or replace function public.complete_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session public.volunteer_sessions;
  v_hours int;
  v_points int;
  v_attended int;
  v_row record;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into v_session from public.volunteer_sessions where id = p_session_id;
  if v_session.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not public.is_initiative_leader(v_session.initiative_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_session.status <> 'approved' then
    raise exception 'validation: session not in approved state' using errcode = '22023';
  end if;
  v_hours := greatest(1, least(8, floor(extract(epoch from (v_session.end_at - v_session.start_at)) / 3600)::int));
  v_points := least(50, v_hours * 10);
  update public.volunteer_sessions set status = 'completed', updated_at = now()
    where id = p_session_id and status = 'approved';
  update public.volunteer_signups vs
  set hours = v_hours, points_awarded = v_points
  from (select id, volunteer_id from public.volunteer_signups where session_id = p_session_id and status = 'attended') sub
  where vs.id = sub.id;
  get diagnostics v_attended = row_count;
  for v_row in
    select id, volunteer_id from public.volunteer_signups
    where session_id = p_session_id and status = 'attended'
  loop
    perform public.try_award_points(v_row.volunteer_id, v_points, 'volunteer_complete', 'volunteer_signups', v_row.id);
  end loop;
  return jsonb_build_object('status','completed','per_volunteer', v_points, 'attended', v_attended);
end; $$;

create or replace function public.approve_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.volunteer_sessions
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_session_id and status = 'pending'
  returning status into v_status;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object('status','approved');
end; $$;

create or replace function public.reject_session(p_session_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r_created_by uuid;
  r_initiative uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select created_by, initiative_id into r_created_by, r_initiative
    from public.volunteer_sessions where id = p_session_id;
  update public.volunteer_sessions
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      reject_reason = p_reason, updated_at = now()
  where id = p_session_id and status = 'pending';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if r_created_by is not null then
    insert into public.notifications (user_id, type, title_ar, title_fr, title_en, body_ar, body_fr, body_en, initiative_id)
    values (r_created_by, 'volunteer_rejected',
      'تم رفض نشاط التطوع', 'Session de bénévolat rejetée', 'Volunteer session rejected',
      coalesce(p_reason, 'راجع البيانات وأعد المحاولة'), coalesce(p_reason, 'Vérifiez les données et réessayez'), coalesce(p_reason, 'Check the data and try again'),
      r_initiative);
  end if;
  return jsonb_build_object('status','rejected');
end; $$;

-- ---------- Audit trigger backstops ----------
create or replace function public.trg_audit_session_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','rejected') and new.status is distinct from old.status then
    insert into public.audit_logs (actor_user_id, action, entity, entity_id, success, meta)
    values (auth.uid(), 'volunteer_session_' || new.status, 'volunteer_sessions', new.id::text, true,
            jsonb_build_object('reason', new.reject_reason));
  end if;
  return new;
end; $$;

create trigger trg_audit_session_status
after update of status on public.volunteer_sessions
for each row execute function public.trg_audit_session_status();

create or replace function public.trg_audit_initiative_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.is_approved and new.is_approved is distinct from old.is_approved then
    insert into public.audit_logs (actor_user_id, action, entity, entity_id, success, meta)
    values (auth.uid(), 'initiative_unapproved', 'initiatives', new.id::text, true, '{}'::jsonb);
  end if;
  return new;
end; $$;

create trigger trg_audit_initiative_status
after update of is_approved on public.initiatives
for each row execute function public.trg_audit_initiative_status();

-- ============================================================================
-- PHASE A: schema/UI parity + server-enforced points ledger
-- ============================================================================

alter table public.school_visits drop constraint school_visits_school_type_check;
alter table public.school_visits add constraint school_visits_school_type_check
  check (school_type in ('public','private'));
alter table public.school_visits drop constraint school_visits_activity_type_check;
alter table public.school_visits add constraint school_visits_activity_type_check
  check (activity_type in ('awareness_day','hostel_visit','competition','partnership'));

alter table public.club_members add column status text not null default 'active';

alter table public.training_enrollments alter column completed_at drop not null;
alter table public.training_enrollments alter column completed_at set default now();

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null check (amount <> 0),
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
alter table public.points_ledger enable row level security;
drop policy if exists "Users read own ledger" on points_ledger;
create policy "Users read own ledger" on points_ledger for select
  using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "Ledger writes are function-only" on points_ledger;
create policy "Ledger writes are function-only" on points_ledger for insert with check (false);

create table if not exists public.awareness_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_id uuid references public.awareness_content(id) on delete cascade not null,
  passed boolean not null default false,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, content_id)
);
alter table public.awareness_quiz_attempts enable row level security;
drop policy if exists "Users read own quiz attempts" on awareness_quiz_attempts;
create policy "Users read own quiz attempts" on awareness_quiz_attempts for select
  using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "Quiz writes are function-only" on awareness_quiz_attempts;
create policy "Quiz writes are function-only" on awareness_quiz_attempts for insert with check (false);

create or replace function public.try_award_points(p_user_id uuid, p_amount int, p_reason text, p_ref_type text, p_ref_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
  values (p_user_id, p_amount, p_reason, p_ref_type, p_ref_id);
  update public.profiles set impact_points = impact_points + p_amount, updated_at = now()
  where id = p_user_id;
end; $$;

create or replace function public.trg_club_join_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.try_award_points(new.user_id, 100, 'club_join', 'club_members', new.club_id);
  return new;
end; $$;
drop trigger if exists trg_club_join_points on public.club_members;
create trigger trg_club_join_points after insert on public.club_members
  for each row execute function public.trg_club_join_points();

create or replace function public.trg_training_complete_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and new.status is distinct from old.status then
    perform public.try_award_points(new.user_id, 200, 'training_complete', 'training_enrollments', new.id);
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end; $$;
drop trigger if exists trg_training_complete_points on public.training_enrollments;
create trigger trg_training_complete_points after update of status on public.training_enrollments
  for each row execute function public.trg_training_complete_points();

create or replace function public.trg_school_visit_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('confirmed','completed') and new.status is distinct from old.status and new.user_id is not null then
    perform public.try_award_points(new.user_id, 120, 'school_visit', 'school_visits', new.id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_school_visit_points on public.school_visits;
create trigger trg_school_visit_points after update of status on public.school_visits
  for each row execute function public.trg_school_visit_points();

create or replace function public.record_quiz_attempt(p_content_id uuid, p_passed boolean, p_score integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_passed boolean := coalesce(p_passed, false);
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  insert into public.awareness_quiz_attempts (user_id, content_id, passed, score)
  values (auth.uid(), p_content_id, v_passed, coalesce(p_score, 0))
  on conflict (user_id, content_id) do update set passed = excluded.passed, score = excluded.score;
  if v_passed and not exists (
    select 1 from public.points_ledger
    where user_id = auth.uid() and reason = 'awareness_quiz' and ref_id = p_content_id
  ) then
    perform public.try_award_points(auth.uid(), 50, 'awareness_quiz', 'awareness_content', p_content_id);
  end if;
  return jsonb_build_object('status', 'recorded');
end; $$;

create or replace function public.award_points_admin(p_user_id uuid, p_amount int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.try_award_points(p_user_id, p_amount, coalesce(p_reason, 'admin_adjustment'), 'admin', null);
  return jsonb_build_object('status', 'awarded');
end; $$;

create or replace function public.get_impact_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_breakdown jsonb;
  v_tier int;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_user_id is distinct from auth.uid() and not public.is_platform_admin()
     then raise exception 'forbidden' using errcode = '42501'; end if;
  select coalesce(sum(amount), 0),
         coalesce(jsonb_object_agg(reason, total), '{}'::jsonb)
  into v_total, v_breakdown
  from (
    select reason, sum(amount) as total
    from public.points_ledger where user_id = p_user_id group by reason
  ) s;
  v_tier := case when v_total >= 2000 then 5 when v_total >= 1000 then 4
                 when v_total >= 500  then 3 when v_total >= 250 then 2
                 when v_total > 0     then 1 else 0 end;
  return jsonb_build_object('total_points', v_total, 'breakdown', v_breakdown, 'badge_tier', v_tier);
end; $$;

create or replace function public.get_platform_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'clubs', (select count(*) from public.clubs),
    'members', (select count(*) from public.profiles),
    'school_visits', (select count(*) from public.school_visits),
    'volunteer_hours', (select coalesce(sum(hours), 0) from public.volunteer_signups)
  );
$$;

create or replace function public.update_profile_settings(
  p_lang text default null, p_theme text default null,
  p_full_name text default null, p_phone text default null,
  p_wilaya text default null, p_neighborhood text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  update public.profiles set
    lang = coalesce(p_lang, lang),
    theme = coalesce(p_theme, theme),
    full_name = coalesce(p_full_name, full_name),
    phone = coalesce(p_phone, phone),
    wilaya = coalesce(p_wilaya, wilaya),
    neighborhood = coalesce(p_neighborhood, neighborhood),
    updated_at = now()
  where id = auth.uid();
  return jsonb_build_object('status', 'updated');
end; $$;

